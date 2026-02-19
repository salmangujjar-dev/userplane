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
 * - Dodo product metadata fetching for entitlements and feature gates
 */

import type { CacheService } from '@workspace/cache';
import { type AddonItems, AddonItemsSchema } from '@workspace/contract';
import { type DbClient, eq, subscriptions, workspaces } from '@workspace/db';
import { getDodoPaymentsClient } from '@workspace/payments/client';
import { fetchProductMetadata } from '@workspace/payments/metadata';
import { getPlanIdFromProductId } from '@workspace/payments/products';
import { validateTransition } from '@workspace/payments/state-machine';
import type {
  DodoSubscription,
  SubscriptionStatus,
  WebhookPayload,
} from '@workspace/payments/types';
import { isSubscriptionEvent, parseSubscriptionDates } from '@workspace/payments/webhooks';
import type { PlanId } from '@workspace/pricing';
import { z } from 'zod';

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

const logger = createLogger('webhook-processor');

const WebhookAddonItemInputSchema = z.object({
  addon_id: z.string().optional(),
  addonId: z.string().optional(),
  quantity: z.number().int().min(0).optional().default(0),
});

const WebhookAddonsInputSchema = z.array(WebhookAddonItemInputSchema);

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
}

export class WebhookProcessorService {
  constructor(private deps: WebhookProcessorDeps) {}

  private parseSubscriptionAddons(subscription: DodoSubscription): AddonItems {
    const raw = (subscription as { addons?: unknown }).addons;

    if (!Array.isArray(raw)) return [];

    const rawParsed = WebhookAddonsInputSchema.safeParse(raw);
    if (!rawParsed.success) return [];

    const normalized = rawParsed.data.map((item) => ({
      addonId: item.addon_id ?? item.addonId ?? '',
      quantity: item.quantity,
    }));
    const parsed = AddonItemsSchema.safeParse(normalized);
    return parsed.success ? parsed.data : [];
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
    // webhook-timestamp header is Unix seconds, convert to milliseconds for Date
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);

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
    // webhook-timestamp header is Unix seconds, convert to milliseconds for Date
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);
    const subscriptionId = subscription.subscription_id;
    const dates = parseSubscriptionDates(subscription);
    const incomingAddons = this.parseSubscriptionAddons(subscription);

    // Find existing subscription
    logger.debug({ subscriptionId }, 'Looking up subscription');
    const current = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId, {
      tx,
    });

    // Handle new subscription (subscription.active for new subscriptions)
    if (!current && eventType === 'subscription.active') {
      logger.debug({ subscriptionId }, 'New subscription detected, handling creation');
      return this.handleNewSubscription(tx, headers, payload, subscription);
    }

    // If no existing subscription and not a new subscription event, skip
    if (!current) {
      logger.debug({ subscriptionId }, 'Skipping: no existing subscription found');
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        skipReason: `No existing subscription found for ${subscriptionId}`,
      });
      return {
        processed: false,
        skipped: true,
        skipReason: `No existing subscription found for ${subscriptionId}`,
        subscriptionId,
      };
    }

    logger.debug(
      { subscriptionId, status: current.status, periodEnd: current.currentPeriodEnd },
      'Found subscription'
    );

    // 4. Out-of-order detection
    const isStale = this.isStaleWebhook(current, subscription, eventTimestamp);
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
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        previousStatus: current.status,
        skipReason: 'Stale webhook (older than last processed)',
      });
      return {
        processed: false,
        skipped: true,
        skipReason: 'Stale webhook (older than last processed)',
        previousStatus: current.status,
        subscriptionId,
      };
    }

    // 5. Determine target status from subscription payload
    let targetStatus = subscription.status;

    if (!targetStatus) {
      logger.debug(
        { subscriptionId, currentStatus: current.status },
        'Skipping: no status in subscription payload'
      );
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        previousStatus: current.status,
        skipReason: 'No status in subscription payload',
      });
      return {
        processed: false,
        skipped: true,
        skipReason: 'No status in subscription payload',
        previousStatus: current.status,
        subscriptionId,
      };
    }

    logger.debug(
      { subscriptionId, targetStatus, currentStatus: current.status },
      'Determined target status from payload'
    );

    // 6. State machine validation
    logger.debug(
      { subscriptionId, fromStatus: current.status, toStatus: targetStatus },
      'Validating transition'
    );
    const validation = validateTransition(
      current.status as SubscriptionStatus,
      targetStatus,
      current.cancelAtPeriodEnd
    );

    if (!validation.valid) {
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
          targetStatus = upstreamStatus;
        } else {
          logger.debug(
            { subscriptionId, webhookStatus: targetStatus, upstreamStatus },
            'Skipping: both webhook and upstream transitions invalid'
          );
          await this.deps.webhookEventsRepo.markSkipped(webhookId, {
            previousStatus: current.status,
            skipReason: `Invalid transition: ${current.status} → ${targetStatus} (upstream: ${upstreamStatus})`,
          });
          return {
            processed: false,
            skipped: true,
            skipReason: `Invalid transition: ${current.status} → ${targetStatus}`,
            previousStatus: current.status,
            subscriptionId,
          };
        }
      } else {
        logger.debug(
          { subscriptionId, reason: validation.reason },
          'Skipping: upstream verification failed, rejecting transition'
        );
        await this.deps.webhookEventsRepo.markSkipped(webhookId, {
          previousStatus: current.status,
          skipReason:
            validation.reason || `Invalid transition: ${current.status} → ${targetStatus}`,
        });
        return {
          processed: false,
          skipped: true,
          skipReason:
            validation.reason || `Invalid transition: ${current.status} → ${targetStatus}`,
          previousStatus: current.status,
          subscriptionId,
        };
      }
    }

    // 7. Apply the transition
    const planId = getPlanIdFromProductId(subscription.product_id);
    const planChanged = !!planId && planId !== current.planId;
    const addonsChanged =
      JSON.stringify(current.addons ?? []) !== JSON.stringify(incomingAddons ?? []);
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

    // Fetch Dodo product metadata for plan changes (outside critical section to avoid holding locks)
    let metadata = null;
    if ((planId && planChanged) || addonsChanged) {
      try {
        if (this.deps.dodoClient) {
          metadata = await fetchProductMetadata(this.deps.dodoClient, subscription.product_id);
        }
      } catch (error) {
        logger.error(
          { err: error, productId: subscription.product_id },
          'Failed to fetch product metadata for plan change'
        );
        captureException(error, undefined, {
          operation: 'fetch_product_metadata',
          productId: subscription.product_id,
        });
      }
    }

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
    };

    await this.deps.subscriptionRepo.updateBySubscriptionId(
      subscriptionId,
      subscriptionUpdateData,
      { tx }
    );

    // Handle entitlement updates based on event type
    const workspaceId = await this.getWorkspaceIdFromSubscription(subscriptionId, { tx });
    if (workspaceId) {
      // Check if this is a renewal (new billing period)
      const isRenewal =
        targetStatus === 'active' &&
        current.status === 'active' &&
        dates.currentPeriodStart > current.currentPeriodStart;

      if (isRenewal) {
        logger.debug({ workspaceId }, 'Resetting period usage for workspace');
        await this.deps.entitlementService.resetPeriodUsage(workspaceId, { tx });
      }

      // Handle plan/add-on changes with metadata
      if (planChanged || addonsChanged) {
        if (metadata?.featureLimits) {
          logger.debug(
            {
              workspaceId,
              fromPlan: current.planId,
              toPlan: planId ?? current.planId,
              addonsChanged,
            },
            'Updating entitlements from metadata for plan/add-on change'
          );
          await this.deps.entitlementService.updateFromMetadata(
            workspaceId,
            metadata.featureLimits,
            {
              tx,
              addons: incomingAddons,
            }
          );
        } else {
          logger.error(
            {
              workspaceId,
              planId: planId ?? current.planId,
              productId: subscription.product_id,
              addonsChanged,
            },
            'Plan/add-on change without feature_limits metadata - entitlements NOT updated'
          );
          captureException(
            new Error('Plan/add-on change without feature_limits metadata'),
            undefined,
            {
              operation: 'webhook_addon_change_no_metadata',
              workspaceId,
              planId: planId ?? current.planId,
              productId: subscription.product_id,
            }
          );
        }
      }
    }

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
    payload: WebhookPayload,
    subscription: DodoSubscription
  ): Promise<ProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;
    const dates = parseSubscriptionDates(subscription);
    const planId = getPlanIdFromProductId(subscription.product_id);
    const incomingAddons = this.parseSubscriptionAddons(subscription);

    logger.debug({ subscriptionId }, 'Handling new subscription');

    // Extract workspace ID from metadata
    const workspaceId = subscription.metadata?.workspace_id || subscription.metadata?.workspaceId;

    logger.debug(
      { subscriptionId, workspaceId, productId: subscription.product_id, planId },
      'Extracted subscription metadata'
    );

    if (!workspaceId) {
      logger.debug({ subscriptionId }, 'Skipping: no workspace_id in metadata');
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        skipReason: 'No workspace_id in metadata for new subscription',
      });
      return {
        processed: false,
        skipped: true,
        skipReason: 'No workspace_id in metadata for new subscription',
        subscriptionId,
      };
    }

    // Fetch Dodo product metadata (outside DB transaction to avoid holding locks)
    let metadata = null;
    try {
      if (this.deps.dodoClient) {
        metadata = await fetchProductMetadata(this.deps.dodoClient, subscription.product_id);
      }
    } catch (error) {
      logger.error(
        { err: error, productId: subscription.product_id },
        'Failed to fetch product metadata for new subscription'
      );
      captureException(error, undefined, {
        operation: 'fetch_product_metadata_new_subscription',
        productId: subscription.product_id,
      });
    }

    // Validate metadata is present
    if (!metadata?.featureLimits || !metadata?.featureGates) {
      logger.error(
        { subscriptionId, productId: subscription.product_id },
        'Skipping new subscription: missing feature_limits or feature_gates in product metadata'
      );
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        skipReason: `Missing product metadata (feature_limits/feature_gates) for product: ${subscription.product_id}`,
      });
      return {
        processed: false,
        skipped: true,
        skipReason: `Missing product metadata for product: ${subscription.product_id}`,
        subscriptionId,
      };
    }

    // Check if workspace already has a subscription (might be a plan change)
    const existingWorkspaceSubscription =
      await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (existingWorkspaceSubscription) {
      logger.debug(
        { workspaceId, existingSubscriptionId: existingWorkspaceSubscription.subscriptionId },
        'Workspace has existing subscription, updating (plan change scenario)'
      );

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

      await this.deps.webhookEventsRepo.markProcessed(
        webhookId,
        {
          previousStatus: existingWorkspaceSubscription.status,
          newStatus: 'active',
        },
        { tx }
      );

      // Update entitlements from metadata
      logger.debug({ workspaceId, planId }, 'Updating entitlements from metadata for plan change');
      await this.deps.entitlementService.updateFromMetadata(workspaceId, metadata.featureLimits, {
        tx,
        addons: incomingAddons,
      });

      // Invalidate billing caches for this workspace
      await this.invalidateBillingCache(workspaceId);

      logger.debug(
        {
          workspaceId,
          subscriptionId,
          fromStatus: existingWorkspaceSubscription.status,
          toStatus: 'active',
        },
        'Successfully updated existing subscription'
      );

      return {
        processed: true,
        skipped: false,
        previousStatus: existingWorkspaceSubscription.status,
        newStatus: 'active',
        subscriptionId,
      };
    }

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
      },
      { tx }
    );

    // Update workspace customer ID
    logger.debug({ workspaceId, customerId }, 'Updating workspace customer ID');
    await this.updateWorkspaceCustomerId(workspaceId, customerId, { tx });

    // Provision entitlements from metadata
    logger.debug({ workspaceId, planId }, 'Provisioning entitlements from metadata');
    await this.deps.entitlementService.updateFromMetadata(workspaceId, metadata.featureLimits, {
      tx,
      addons: incomingAddons,
    });

    await this.deps.webhookEventsRepo.markProcessed(
      webhookId,
      {
        previousStatus: undefined,
        newStatus: 'active',
      },
      { tx }
    );

    // Invalidate billing caches for this workspace
    await this.invalidateBillingCache(workspaceId);

    logger.debug({ workspaceId, subscriptionId }, 'Successfully created new subscription');

    return {
      processed: true,
      skipped: false,
      previousStatus: undefined,
      newStatus: 'active',
      subscriptionId,
    };
  }

  /**
   * Check if a webhook is stale (older than last processed)
   */
  private isStaleWebhook(
    current: { lastWebhookTimestamp: Date | null; currentPeriodEnd: Date },
    incoming: DodoSubscription,
    eventTimestamp: Date
  ): boolean {
    if (current.lastWebhookTimestamp && eventTimestamp < current.lastWebhookTimestamp) {
      return true;
    }
    return false;
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
