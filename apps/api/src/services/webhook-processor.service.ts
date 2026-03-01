/**
 * WebhookProcessorService - Production-ready DodoPayments webhook processor
 *
 * Provides:
 * - Idempotency tracking (prevent duplicate processing)
 * - State machine validation (reject invalid transitions)
 * - Out-of-order detection (compare timestamps/billing periods)
 * - Upstream verification (fetch from DodoPayments API when ambiguous)
 * - Audit trail (store all webhook events)
 * - Cache invalidation on subscription state changes
 *
 * Plan metadata resolution is delegated to PlanMetadataResolver.
 * Addon parsing/mapping is delegated to AddonMapper.
 */

import type { CacheService } from '@userplane/cache';
import type { AddonItems } from '@userplane/contract';
import { type DbClient, eq, subscriptions, workspaces } from '@userplane/db';
import type { getDodoPaymentsClient } from '@userplane/payments/client';
import { getPlanIdFromProductId } from '@userplane/payments/products';
import { validateTransition } from '@userplane/payments/state-machine';
import type {
  DodoSubscription,
  ProductPlanMetadata,
  SubscriptionStatus,
  WebhookPayload,
} from '@userplane/payments/types';
import { isSubscriptionEvent, parseSubscriptionDates } from '@userplane/payments/webhooks';
import type { BillingCadence, PlanId } from '@userplane/pricing';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type {
  SubscriptionRepository,
  UpdateSubscriptionData,
} from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { Transaction } from '@/api/types';

import { generateSubscriptionId } from '../lib/id';
import type { AddonMapper } from './addon-mapper';
import type { PlanMetadataResolver } from './plan-metadata-resolver';

const logger = createLogger('webhook-processor');

/**
 * Webhook headers from DodoPayments
 */
export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
}

/**
 * Result of webhook processing
 */
export interface ProcessingResult {
  processed: boolean;
  skipped: boolean;
  skipReason?: string;
  previousStatus?: string;
  newStatus?: string;
  subscriptionId?: string;
  error?: string;
}

export interface WebhookProcessorDeps {
  subscriptionRepo: SubscriptionRepository;
  webhookEventsRepo: WebhookEventsRepository;
  workspaceRepo: WorkspaceRepository;
  entitlementService: EntitlementService;
  db: DbClient;
  dodoClient?: ReturnType<typeof getDodoPaymentsClient>;
  cacheService: CacheService;
  addonMapper: AddonMapper;
  metadataResolver: PlanMetadataResolver;
}

export class WebhookProcessorService {
  constructor(private deps: WebhookProcessorDeps) {}

  private static parseEventTimestamp(webhookTimestamp: string): Date {
    return new Date(parseInt(webhookTimestamp, 10) * 1000);
  }

  /**
   * Compare two addon lists for equality, ignoring order.
   */
  private static hasAddonsChanged(current: AddonItems, incoming: AddonItems): boolean {
    const normalize = (addons: AddonItems) =>
      JSON.stringify([...addons].sort((a, b) => a.addonId.localeCompare(b.addonId)));
    return normalize(current) !== normalize(incoming);
  }

  private async skipResult(
    webhookId: string,
    skipReason: string,
    subscriptionId?: string,
    previousStatus?: string
  ): Promise<ProcessingResult> {
    await this.deps.webhookEventsRepo.markSkipped(webhookId, {
      skipReason,
      ...(previousStatus && { previousStatus }),
    });
    return {
      processed: false,
      skipped: true,
      skipReason,
      previousStatus,
      subscriptionId,
    };
  }

  /**
   * Process a webhook event with full validation
   */
  async processWebhook(
    headers: WebhookHeaders,
    payload: WebhookPayload
  ): Promise<ProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventType = payload.type;
    const eventTimestamp = WebhookProcessorService.parseEventTimestamp(webhookTimestamp);

    logger.debug({ webhookId, eventType, webhookTimestamp }, 'Processing webhook');

    // Skip non-subscription events
    if (!isSubscriptionEvent(eventType)) {
      logger.debug({ eventType }, 'Skipping non-subscription event');
      return { processed: false, skipped: true, skipReason: 'Not a subscription event' };
    }

    const subscription = payload.data as DodoSubscription;
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;

    logger.debug({ subscriptionId, customerId }, 'Processing subscription webhook');

    // 1. Idempotency check - has this webhook already been processed?
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      logger.debug({ webhookId }, 'Skipping already processed webhook (idempotency)');
      return {
        processed: false,
        skipped: true,
        skipReason: 'Already processed',
        subscriptionId,
      };
    }

    // 2. Record the webhook event (even if we skip it later)
    const businessId = payload.business_id;
    const existingEvent = await this.deps.webhookEventsRepo.exists(webhookId);
    if (!existingEvent) {
      logger.debug({ webhookId }, 'Recording new webhook event');
      await this.deps.webhookEventsRepo.create({
        id: webhookId,
        eventType,
        businessId,
        eventTimestamp,
        subscriptionId,
        customerId,
        payload: payload as unknown as Record<string, unknown>,
      });
    }

    // 3. Process in transaction
    try {
      logger.debug({ webhookId }, 'Starting transaction for webhook');
      return await this.deps.db.transaction(async (tx) => {
        return this.processInTransaction(tx, headers, payload, subscription);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ webhookId, err: errorMessage }, 'Error processing webhook');
      await this.deps.webhookEventsRepo.markFailed(webhookId, { error: errorMessage });
      throw error;
    }
  }

  /**
   * Process webhook within a transaction
   */
  private async processInTransaction(
    tx: Transaction,
    headers: WebhookHeaders,
    payload: WebhookPayload,
    subscription: DodoSubscription
  ): Promise<ProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventType = payload.type;
    const eventTimestamp = WebhookProcessorService.parseEventTimestamp(webhookTimestamp);
    const subscriptionId = subscription.subscription_id;
    const dates = parseSubscriptionDates(subscription);
    const incomingAddons = this.deps.addonMapper.parseFromSubscription(subscription);

    // Find existing subscription
    logger.debug({ subscriptionId }, 'Looking up subscription');
    const current = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId, {
      tx,
    });

    // Handle new subscription (subscription.active for new subscriptions)
    if (!current && eventType === 'subscription.active') {
      logger.debug({ subscriptionId }, 'New subscription detected, handling creation');
      return this.handleNewSubscription(tx, headers, subscription);
    }

    // If no existing subscription and not a new subscription event, skip
    if (!current) {
      logger.debug({ subscriptionId }, 'Skipping: no existing subscription found');
      return this.skipResult(
        webhookId,
        `No existing subscription found for ${subscriptionId}`,
        subscriptionId
      );
    }

    logger.debug(
      { subscriptionId, status: current.status, periodEnd: current.currentPeriodEnd },
      'Found subscription'
    );

    // 4. Out-of-order detection
    const isStale = !!(
      current.lastWebhookTimestamp && eventTimestamp < current.lastWebhookTimestamp
    );
    if (isStale) {
      const timeDiff = current.lastWebhookTimestamp
        ? (current.lastWebhookTimestamp.getTime() - eventTimestamp.getTime()) / 1000
        : 0;
      logger.debug(
        {
          webhookId,
          eventTimestamp: eventTimestamp.toISOString(),
          lastWebhookTimestamp: current.lastWebhookTimestamp?.toISOString() || null,
          timeDiffSeconds: timeDiff,
        },
        'Skipping stale webhook (out-of-order)'
      );
      return this.skipResult(
        webhookId,
        'Stale webhook (older than last processed)',
        subscriptionId,
        current.status
      );
    }

    // 5–6. Validate and resolve target status
    const resolvedStatus = await this.validateAndResolveTargetStatus(
      webhookId,
      subscriptionId,
      subscription.status,
      current
    );
    if (typeof resolvedStatus !== 'string') {
      return resolvedStatus;
    }
    const targetStatus = resolvedStatus;

    // 7. Apply the transition
    const workspaceId = await this.applyTransition(
      tx,
      webhookId,
      eventTimestamp,
      subscription,
      current,
      targetStatus,
      dates,
      incomingAddons
    );

    // 8. Mark webhook as processed
    await this.deps.webhookEventsRepo.markProcessed(
      webhookId,
      {
        previousStatus: current.status,
        newStatus: targetStatus,
      },
      { tx }
    );

    // 9. Invalidate billing caches for this workspace
    if (workspaceId) {
      await this.invalidateBillingCache(workspaceId);
    }

    logger.debug(
      { subscriptionId, fromStatus: current.status, toStatus: targetStatus },
      'Successfully processed webhook'
    );

    return {
      processed: true,
      skipped: false,
      previousStatus: current.status,
      newStatus: targetStatus,
      subscriptionId,
    };
  }

  /**
   * Handle new subscription creation from subscription.active webhook
   */
  private async handleNewSubscription(
    tx: Transaction,
    headers: WebhookHeaders,
    subscription: DodoSubscription
  ): Promise<ProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventTimestamp = WebhookProcessorService.parseEventTimestamp(webhookTimestamp);
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;
    const dates = parseSubscriptionDates(subscription);
    const trialEnd = subscription.trial_period_days > 0 ? dates.currentPeriodEnd : null;
    const planId = getPlanIdFromProductId(subscription.product_id);
    const incomingAddons = this.deps.addonMapper.parseFromSubscription(subscription);

    logger.debug({ subscriptionId, trialEnd }, 'Handling new subscription');

    // Extract workspace ID from metadata
    const workspaceId = subscription.metadata?.workspace_id || subscription.metadata?.workspaceId;

    logger.debug(
      { subscriptionId, workspaceId, productId: subscription.product_id, planId },
      'Extracted subscription metadata'
    );

    if (!workspaceId) {
      logger.debug({ subscriptionId }, 'Skipping: no workspace_id in metadata');
      return this.skipResult(
        webhookId,
        'No workspace_id in metadata for new subscription',
        subscriptionId
      );
    }

    // Resolve plan metadata — prefer the immutable snapshot embedded at checkout time;
    // fall back to a live product fetch for legacy subscriptions, plan-change-via-API
    // subscriptions, or any case where the snapshot is absent/incomplete.
    const metadata = await this.deps.metadataResolver.resolveForSubscription(subscription);

    // If metadata came from a live fetch (no embedded snapshot), backfill it.
    const hadEmbedded = this.hasEmbeddedSnapshot(subscription);
    if (metadata && !hadEmbedded && workspaceId) {
      this.deps.metadataResolver.backfillSnapshot(
        subscriptionId,
        workspaceId,
        subscription.product_id,
        metadata
      );
    }

    // Validate metadata is present
    if (!metadata?.featureLimits || !metadata?.featureGates) {
      logger.error(
        { subscriptionId, productId: subscription.product_id },
        'Skipping new subscription: missing feature_limits or feature_gates in plan metadata'
      );
      return this.skipResult(
        webhookId,
        `Missing plan metadata (feature_limits/feature_gates) for product: ${subscription.product_id}`,
        subscriptionId
      );
    }

    // Check if workspace already has a subscription (might be a plan change)
    const existingWorkspaceSubscription =
      await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    let previousStatus: string | undefined;

    if (existingWorkspaceSubscription) {
      logger.debug(
        { workspaceId, existingSubscriptionId: existingWorkspaceSubscription.subscriptionId },
        'Workspace has existing subscription, updating (plan change scenario)'
      );
      previousStatus = existingWorkspaceSubscription.status;

      // Update existing subscription with new details including featureGates
      await this.deps.subscriptionRepo.updateByWorkspaceId(
        workspaceId,
        {
          status: 'active',
          planId,
          productId: subscription.product_id,
          currentPeriodStart: dates.currentPeriodStart,
          currentPeriodEnd: dates.currentPeriodEnd,
          lastWebhookId: webhookId,
          lastWebhookTimestamp: eventTimestamp,
          featureGates: metadata.featureGates,
          addons: incomingAddons,
          trialEnd,
          billingCadence: metadata.billingCadence ?? null,
        },
        { tx }
      );

      // Update subscription ID if it changed (plan change creates new subscription)
      if (existingWorkspaceSubscription.subscriptionId !== subscriptionId) {
        logger.debug(
          {
            workspaceId,
            oldSubscriptionId: existingWorkspaceSubscription.subscriptionId,
            newSubscriptionId: subscriptionId,
          },
          'Subscription ID changed'
        );

        await (tx as unknown as DbClient)
          .update(subscriptions)
          .set({
            subscriptionId,
            customerId,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingWorkspaceSubscription.id));
      }
    } else {
      // Create new subscription with featureGates
      logger.debug({ workspaceId, subscriptionId }, 'Creating new subscription for workspace');
      await this.deps.subscriptionRepo.create(
        {
          id: generateSubscriptionId(),
          workspaceId,
          customerId,
          subscriptionId,
          productId: subscription.product_id,
          planId: planId as PlanId,
          status: 'active',
          currentPeriodStart: dates.currentPeriodStart,
          currentPeriodEnd: dates.currentPeriodEnd,
          featureGates: metadata.featureGates,
          addons: incomingAddons,
          trialEnd,
          billingCadence: metadata.billingCadence ?? null,
        },
        { tx }
      );

      // Update workspace customer ID
      logger.debug({ workspaceId, customerId }, 'Updating workspace customer ID');
      await this.updateWorkspaceCustomerId(workspaceId, customerId, { tx });
    }

    // Update entitlements: preserve consumption for plan changes, reset for genuinely new subscriptions
    const billingCadence = metadata.billingCadence;
    if (existingWorkspaceSubscription) {
      // Plan change — preserve consumption
      logger.debug({ workspaceId, planId, billingCadence }, 'Updating entitlements (plan change)');
      await this.deps.entitlementService.updateFromMetadata(workspaceId, metadata.featureLimits, {
        tx,
        addons: incomingAddons,
        billingCadence,
      });
    } else {
      // Truly new subscription — reset consumption
      logger.debug(
        { workspaceId, planId, billingCadence },
        'Provisioning entitlements (new subscription)'
      );
      await this.deps.entitlementService.provisionFromMetadata(
        workspaceId,
        metadata.featureLimits,
        {
          tx,
          addons: incomingAddons,
          billingCadence,
        }
      );
    }

    await this.deps.webhookEventsRepo.markProcessed(
      webhookId,
      { previousStatus, newStatus: 'active' },
      { tx }
    );

    await this.invalidateBillingCache(workspaceId);

    logger.debug({ workspaceId, subscriptionId }, 'Successfully handled new subscription');

    return {
      processed: true,
      skipped: false,
      previousStatus,
      newStatus: 'active',
      subscriptionId,
    };
  }

  /**
   * Quick check whether the subscription already carries a valid embedded snapshot.
   * Used to decide whether to backfill after a live fetch.
   */
  private hasEmbeddedSnapshot(subscription: DodoSubscription): boolean {
    const raw = (subscription.metadata ?? {}) as Record<string, unknown>;
    return !!raw['snapshot_product_id'] && raw['snapshot_product_id'] === subscription.product_id;
  }

  private async validateAndResolveTargetStatus(
    webhookId: string,
    subscriptionId: string,
    incomingStatus: SubscriptionStatus,
    current: NonNullable<Awaited<ReturnType<SubscriptionRepository['findBySubscriptionId']>>>
  ): Promise<SubscriptionStatus | ProcessingResult> {
    logger.debug(
      { subscriptionId, fromStatus: current.status, toStatus: incomingStatus },
      'Validating transition'
    );
    const validation = validateTransition(
      current.status as SubscriptionStatus,
      incomingStatus,
      current.cancelAtPeriodEnd
    );

    if (validation.valid) {
      return incomingStatus;
    }

    logger.debug(
      { subscriptionId, reason: validation.reason },
      'Transition invalid, attempting upstream verification'
    );
    const upstreamStatus = await this.verifyUpstream(subscriptionId);

    if (upstreamStatus) {
      logger.debug({ subscriptionId, upstreamStatus }, 'Retrieved upstream status');
      const upstreamValidation = validateTransition(
        current.status as SubscriptionStatus,
        upstreamStatus,
        current.cancelAtPeriodEnd
      );

      if (upstreamValidation.valid) {
        logger.debug({ subscriptionId, upstreamStatus }, 'Using upstream status');
        return upstreamStatus;
      }

      logger.debug(
        { subscriptionId, webhookStatus: incomingStatus, upstreamStatus },
        'Skipping: both webhook and upstream transitions invalid'
      );
      return this.skipResult(
        webhookId,
        `Invalid transition: ${current.status} → ${incomingStatus} (upstream: ${upstreamStatus})`,
        subscriptionId,
        current.status
      );
    }

    logger.debug(
      { subscriptionId, reason: validation.reason },
      'Skipping: upstream verification failed, rejecting transition'
    );
    return this.skipResult(
      webhookId,
      validation.reason || `Invalid transition: ${current.status} → ${incomingStatus}`,
      subscriptionId,
      current.status
    );
  }

  private async applyTransition(
    tx: Transaction,
    webhookId: string,
    eventTimestamp: Date,
    subscription: DodoSubscription,
    current: NonNullable<Awaited<ReturnType<SubscriptionRepository['findBySubscriptionId']>>>,
    targetStatus: SubscriptionStatus,
    dates: ReturnType<typeof parseSubscriptionDates>,
    incomingAddons: AddonItems
  ): Promise<string | null> {
    const subscriptionId = subscription.subscription_id;
    const planId = getPlanIdFromProductId(subscription.product_id);
    const planChanged = !!planId && planId !== current.planId;
    const addonsChanged = WebhookProcessorService.hasAddonsChanged(
      current.addons ?? [],
      incomingAddons ?? []
    );
    logger.debug(
      {
        subscriptionId,
        fromStatus: current.status,
        toStatus: targetStatus,
        planId,
        planChanged,
        addonsChanged,
        periodStart: dates.currentPeriodStart,
        periodEnd: dates.currentPeriodEnd,
      },
      'Applying transition'
    );

    // Always resolve metadata from the subscription so admin overrides
    // (stored as embedded snapshots in subscription metadata) are picked up,
    // not just on plan/addon changes.
    const metadata = await this.deps.metadataResolver.resolveForSubscription(subscription);

    const subscriptionUpdateData: UpdateSubscriptionData = {
      status: targetStatus,
      currentPeriodStart: dates.currentPeriodStart,
      currentPeriodEnd: dates.currentPeriodEnd,
      cancelledAt: dates.cancelledAt,
      ...(planId && { planId, productId: subscription.product_id }),
      addons: incomingAddons,
      lastWebhookId: webhookId,
      lastWebhookTimestamp: eventTimestamp,
      ...(metadata?.featureGates && { featureGates: metadata.featureGates }),
      ...(metadata?.billingCadence !== undefined && { billingCadence: metadata.billingCadence }),
    };

    await this.deps.subscriptionRepo.updateBySubscriptionId(
      subscriptionId,
      subscriptionUpdateData,
      { tx }
    );

    // Handle entitlement updates
    const workspaceId = await this.getWorkspaceIdFromSubscription(subscriptionId, { tx });
    if (workspaceId) {
      // Backfill the fetched metadata snapshot onto the Dodo subscription so future
      // webhooks carry it directly.  Fire-and-forget — non-fatal if it fails.
      if (metadata) {
        this.deps.metadataResolver.backfillSnapshot(
          subscriptionId,
          workspaceId,
          subscription.product_id,
          metadata
        );
      }

      await this.applyEntitlementUpdates(tx, workspaceId, {
        targetStatus,
        currentStatus: current.status,
        currentPeriodStart: current.currentPeriodStart,
        newPeriodStart: dates.currentPeriodStart,
        planChanged,
        addonsChanged,
        metadata,
        incomingAddons,
        planId: planId ?? current.planId,
        productId: subscription.product_id,
        billingCadence: metadata?.billingCadence ?? null,
      });
    }

    return workspaceId;
  }

  private async applyEntitlementUpdates(
    tx: Transaction,
    workspaceId: string,
    opts: {
      targetStatus: SubscriptionStatus;
      currentStatus: string;
      currentPeriodStart: Date;
      newPeriodStart: Date;
      planChanged: boolean;
      addonsChanged: boolean;
      metadata: ProductPlanMetadata | null;
      incomingAddons: AddonItems;
      planId: PlanId | null;
      productId: string;
      billingCadence: BillingCadence | null;
    }
  ): Promise<void> {
    // Check if this is a renewal (new billing period)
    const isRenewal =
      opts.targetStatus === 'active' &&
      opts.currentStatus === 'active' &&
      opts.newPeriodStart > opts.currentPeriodStart;

    if (isRenewal) {
      logger.debug({ workspaceId }, 'Resetting period usage for workspace');
      await this.deps.entitlementService.resetPeriodUsage(workspaceId, { tx });
    }

    // Update entitlements when metadata is available.
    // This covers plan changes, addon changes, AND admin-only metadata overrides
    // (where plan/addons didn't change but subscription metadata was updated).
    if (opts.metadata?.featureLimits) {
      logger.debug(
        {
          workspaceId,
          planId: opts.planId,
          planChanged: opts.planChanged,
          addonsChanged: opts.addonsChanged,
        },
        'Updating entitlements from metadata'
      );
      await this.deps.entitlementService.updateFromMetadata(
        workspaceId,
        opts.metadata.featureLimits,
        {
          tx,
          addons: opts.incomingAddons,
          billingCadence: opts.billingCadence,
        }
      );
    } else if (opts.planChanged || opts.addonsChanged) {
      // Plan or addon changed but no metadata available — this is an error
      logger.error(
        {
          workspaceId,
          planId: opts.planId,
          productId: opts.productId,
          addonsChanged: opts.addonsChanged,
        },
        'Plan/add-on change without feature_limits metadata - entitlements NOT updated'
      );
      captureException(new Error('Plan/add-on change without feature_limits metadata'), undefined, {
        operation: 'webhook_addon_change_no_metadata',
        workspaceId,
        planId: opts.planId,
        productId: opts.productId,
      });
    }
  }

  /**
   * Verify subscription status from upstream DodoPayments API
   */
  private async verifyUpstream(subscriptionId: string): Promise<SubscriptionStatus | null> {
    if (!this.deps.dodoClient) {
      logger.warn({ subscriptionId }, 'No DodoPayments client available for upstream verification');
      captureException(
        new Error('dodopayment client missing for upstream verification'),
        undefined,
        {
          operation: 'webhook_processor_verify_upstream',
          subscriptionId,
        }
      );
      return null;
    }

    try {
      const upstream = await this.deps.dodoClient.subscriptions.retrieve(subscriptionId);
      return upstream.status;
    } catch (error) {
      logger.error({ subscriptionId, err: error }, 'Upstream verification failed');
      captureException(error, undefined, {
        operation: 'upstream_verification',
        subscription_id: subscriptionId,
      });
      return null;
    }
  }

  /**
   * Update workspace DodoPayments customer ID
   */
  private async updateWorkspaceCustomerId(
    workspaceId: string,
    customerId: string,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    await (dbClient as unknown as DbClient)
      .update(workspaces)
      .set({ dodoCustomerId: customerId })
      .where(eq(workspaces.workspaceId, workspaceId));
  }

  /**
   * Get workspace ID from subscription ID
   */
  private async getWorkspaceIdFromSubscription(
    subscriptionId: string,
    options?: { tx?: Transaction }
  ): Promise<string | null> {
    const subscription = await this.deps.subscriptionRepo.findBySubscriptionId(
      subscriptionId,
      options
    );
    return subscription?.workspaceId || null;
  }

  /**
   * Invalidate all billing-related caches for a workspace
   * Called after successful subscription state changes
   */
  private async invalidateBillingCache(workspaceId: string): Promise<void> {
    try {
      await this.deps.cacheService.invalidateWorkspaceBilling(workspaceId);
      logger.debug({ workspaceId }, 'Invalidated billing cache for workspace');
    } catch (error) {
      logger.warn({ workspaceId, err: error }, 'Failed to invalidate billing cache for workspace');
      captureException(error, undefined, {
        operation: 'invalidate_billing_cache',
        workspaceId,
      });
    }
  }
}
