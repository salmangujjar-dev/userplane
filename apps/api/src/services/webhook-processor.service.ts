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
 */

import type { CacheService } from '@workspace/cache';
import { type DbClient, eq, subscriptions, workspaces } from '@workspace/db';
import { getDodoPaymentsClient } from '@workspace/payments/client';
import { getPlanIdFromProductId } from '@workspace/payments/products';
import { validateTransition } from '@workspace/payments/state-machine';
import type {
  DodoSubscription,
  SubscriptionStatus,
  WebhookPayload,
} from '@workspace/payments/types';
import { isSubscriptionEvent, parseSubscriptionDates } from '@workspace/payments/webhooks';
import type { PlanId } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { Transaction } from '@/api/types';

import { generateSubscriptionId } from '../lib/id';

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
}

export class WebhookProcessorService {
  constructor(private deps: WebhookProcessorDeps) {}

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

    logger.info({ webhookId, eventType, webhookTimestamp }, 'Processing webhook');

    // Skip non-subscription events
    if (!isSubscriptionEvent(eventType)) {
      logger.info({ eventType }, 'Skipping non-subscription event');
      return { processed: false, skipped: true, skipReason: 'Not a subscription event' };
    }

    const subscription = payload.data as DodoSubscription;
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;

    logger.info({ subscriptionId, customerId }, 'Processing subscription webhook');

    // 1. Idempotency check - has this webhook already been processed?
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      logger.info({ webhookId }, 'Skipping already processed webhook (idempotency)');
      return {
        processed: false,
        skipped: true,
        skipReason: 'Already processed',
        subscriptionId,
      };
    }

    // 2. Record the webhook event (even if we skip it later)
    // business_id is at the payload level, not on the subscription data
    const businessId = (payload as { business_id?: string }).business_id || 'unknown';
    const existingEvent = await this.deps.webhookEventsRepo.exists(webhookId);
    if (!existingEvent) {
      logger.info({ webhookId }, 'Recording new webhook event');
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
      logger.info({ webhookId }, 'Starting transaction for webhook');
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

    // Find existing subscription
    logger.info({ subscriptionId }, 'Looking up subscription');
    const current = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId, {
      tx,
    });

    // Handle new subscription (subscription.active for new subscriptions)
    if (!current && eventType === 'subscription.active') {
      logger.info({ subscriptionId }, 'New subscription detected, handling creation');
      return this.handleNewSubscription(tx, headers, payload, subscription);
    }

    // If no existing subscription and not a new subscription event, skip
    if (!current) {
      logger.info({ subscriptionId }, 'Skipping: no existing subscription found');
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

    logger.info(
      { subscriptionId, status: current.status, periodEnd: current.currentPeriodEnd },
      'Found subscription'
    );

    // 4. Out-of-order detection
    const isStale = this.isStaleWebhook(current, subscription, eventTimestamp);
    if (isStale) {
      const timeDiff = current.lastWebhookTimestamp
        ? (current.lastWebhookTimestamp.getTime() - eventTimestamp.getTime()) / 1000
        : 0;
      logger.info(
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
    // The subscription object always contains the current status, so we read it directly
    let targetStatus = subscription.status;

    if (!targetStatus) {
      logger.info(
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

    logger.info(
      { subscriptionId, targetStatus, currentStatus: current.status },
      'Determined target status from payload'
    );

    // 6. State machine validation
    logger.info(
      { subscriptionId, fromStatus: current.status, toStatus: targetStatus },
      'Validating transition'
    );
    const validation = validateTransition(
      current.status as SubscriptionStatus,
      targetStatus,
      current.cancelAtPeriodEnd
    );

    if (!validation.valid) {
      logger.info(
        { subscriptionId, reason: validation.reason },
        'Transition invalid, attempting upstream verification'
      );
      // Try upstream verification for ambiguous cases
      const upstreamStatus = await this.verifyUpstream(subscriptionId);

      if (upstreamStatus) {
        logger.info({ subscriptionId, upstreamStatus }, 'Retrieved upstream status');
        const upstreamValidation = validateTransition(
          current.status as SubscriptionStatus,
          upstreamStatus,
          current.cancelAtPeriodEnd
        );

        if (upstreamValidation.valid) {
          // Use upstream status instead
          logger.info({ subscriptionId, upstreamStatus }, 'Using upstream status');
          targetStatus = upstreamStatus;
        } else {
          // Both webhook and upstream are invalid
          logger.info(
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
        // Upstream verification failed, reject the transition
        logger.info(
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
    logger.info(
      {
        subscriptionId,
        fromStatus: current.status,
        toStatus: targetStatus,
        planId,
        periodStart: dates.currentPeriodStart,
        periodEnd: dates.currentPeriodEnd,
      },
      'Applying transition'
    );

    await this.deps.subscriptionRepo.updateBySubscriptionId(
      subscriptionId,
      {
        status: targetStatus,
        currentPeriodStart: dates.currentPeriodStart,
        currentPeriodEnd: dates.currentPeriodEnd,
        cancelledAt: dates.cancelledAt,
        ...(planId && { planId, productId: subscription.product_id }),
        lastWebhookId: webhookId,
        lastWebhookTimestamp: eventTimestamp,
      },
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
        // Reset period-based usage (recordings, logs) on renewal
        logger.info({ workspaceId }, 'Resetting period usage for workspace');
        await this.deps.entitlementService.resetPeriodUsage(workspaceId, { tx });
      }

      // Handle plan changes
      if (planId && planId !== current.planId) {
        logger.info(
          { workspaceId, fromPlan: current.planId, toPlan: planId },
          'Updating entitlements for plan change'
        );
        await this.deps.entitlementService.updateForPlan(workspaceId, planId as PlanId, { tx });
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

    logger.info(
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
    // webhook-timestamp header is Unix seconds, convert to milliseconds for Date
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;
    const dates = parseSubscriptionDates(subscription);
    const planId = getPlanIdFromProductId(subscription.product_id);

    logger.info({ subscriptionId }, 'Handling new subscription');

    // Extract workspace ID from metadata
    const workspaceId = subscription.metadata?.workspace_id || subscription.metadata?.workspaceId;

    logger.info(
      { subscriptionId, workspaceId, productId: subscription.product_id, planId },
      'Extracted subscription metadata'
    );

    if (!workspaceId) {
      logger.info({ subscriptionId }, 'Skipping: no workspace_id in metadata');
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

    if (!planId) {
      logger.info(
        { subscriptionId, productId: subscription.product_id },
        'Skipping: unknown product ID'
      );
      await this.deps.webhookEventsRepo.markSkipped(webhookId, {
        skipReason: `Unknown product ID: ${subscription.product_id}`,
      });
      return {
        processed: false,
        skipped: true,
        skipReason: `Unknown product ID: ${subscription.product_id}`,
        subscriptionId,
      };
    }

    // Check if workspace already has a subscription (might be a plan change)
    const existingWorkspaceSubscription =
      await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (existingWorkspaceSubscription) {
      logger.info(
        { workspaceId, existingSubscriptionId: existingWorkspaceSubscription.subscriptionId },
        'Workspace has existing subscription, updating (plan change scenario)'
      );

      // Update existing subscription with new details
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
        },
        { tx }
      );

      // Update subscription ID if it changed (plan change creates new subscription)
      if (existingWorkspaceSubscription.subscriptionId !== subscriptionId) {
        logger.info(
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

      // Update entitlements for new plan (plan change scenario)
      logger.info({ workspaceId, planId }, 'Updating entitlements for plan change');
      await this.deps.entitlementService.updateForPlan(workspaceId, planId as PlanId, { tx });

      // Invalidate billing caches for this workspace
      await this.invalidateBillingCache(workspaceId);

      logger.info(
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

    // Create new subscription
    logger.info({ workspaceId, subscriptionId }, 'Creating new subscription for workspace');
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
      },
      { tx }
    );

    // Update workspace customer ID
    logger.info({ workspaceId, customerId }, 'Updating workspace customer ID');
    await this.updateWorkspaceCustomerId(workspaceId, customerId, { tx });

    // Provision entitlements for the new plan
    // This updates existing free plan entitlements to the paid plan limits
    logger.info({ workspaceId, planId }, 'Provisioning entitlements for plan');
    await this.deps.entitlementService.updateForPlan(workspaceId, planId as PlanId, { tx });

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

    logger.info({ workspaceId, subscriptionId }, 'Successfully created new subscription');

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
   *
   * A webhook is considered stale if its event timestamp is older than the last
   * processed webhook timestamp for this subscription.
   *
   * Important: We do NOT compare billing periods because multiple webhooks can
   * occur within the same billing period:
   * - Plan upgrades/downgrades (same period, different plan)
   * - Subscription cancellations (same period, status change)
   * - Metadata updates (same period, no status change)
   *
   * The webhook-timestamp header from DodoPayments is the canonical source of truth
   * for event ordering. It represents when the event occurred on DodoPayments' side.
   */
  private isStaleWebhook(
    current: { lastWebhookTimestamp: Date | null; currentPeriodEnd: Date },
    incoming: DodoSubscription,
    eventTimestamp: Date
  ): boolean {
    // Only check: is this webhook older than the last one we processed?
    // If we haven't processed any webhooks yet (lastWebhookTimestamp is null),
    // then this webhook is not stale.
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
      return null;
    }

    try {
      const upstream = await this.deps.dodoClient.subscriptions.retrieve(subscriptionId);
      return upstream.status;
    } catch (error) {
      logger.error({ subscriptionId, err: error }, 'Upstream verification failed');
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
      logger.info({ workspaceId }, 'Invalidated billing cache for workspace');
    } catch (error) {
      // Cache invalidation errors should not fail the webhook processing
      logger.warn({ workspaceId, err: error }, 'Failed to invalidate billing cache for workspace');
    }
  }
}
