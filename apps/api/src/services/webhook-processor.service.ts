/**
 * WebhookProcessorService - Production-ready DodoPayments webhook processor
 *
 * Provides:
 * - Idempotency tracking (prevent duplicate processing)
 * - State machine validation (reject invalid transitions)
 * - Out-of-order detection (compare timestamps/billing periods)
 * - Upstream verification (fetch from DodoPayments API when ambiguous)
 * - Audit trail (store all webhook events)
 */

import type { DbClient } from '@workspace/db';
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

import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { Transaction } from '@/api/types';

import { generateSubscriptionId } from '../lib/id';

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

    console.log(`[WebhookProcessor] Processing webhook: ${webhookId}`);
    console.log(`[WebhookProcessor] Event type: ${eventType}, timestamp: ${webhookTimestamp}`);

    // Skip non-subscription events
    if (!isSubscriptionEvent(eventType)) {
      console.log(`[WebhookProcessor] Skipping non-subscription event: ${eventType}`);
      return { processed: false, skipped: true, skipReason: 'Not a subscription event' };
    }

    const subscription = payload.data as DodoSubscription;
    const subscriptionId = subscription.subscription_id;
    const customerId = subscription.customer.customer_id;

    console.log(`[WebhookProcessor] Subscription: ${subscriptionId}, Customer: ${customerId}`);

    // 1. Idempotency check - has this webhook already been processed?
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      console.log(`[WebhookProcessor] SKIP: Webhook ${webhookId} already processed (idempotency)`);
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
      console.log(`[WebhookProcessor] Recording new webhook event: ${webhookId}`);
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
      console.log(`[WebhookProcessor] Starting transaction for webhook: ${webhookId}`);
      return await this.deps.db.transaction(async (tx) => {
        return this.processInTransaction(tx, headers, payload, subscription);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WebhookProcessor] ERROR processing webhook ${webhookId}: ${errorMessage}`);
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
    console.log(`[WebhookProcessor] Looking up subscription: ${subscriptionId}`);
    const current = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId, {
      tx,
    });

    // Handle new subscription (subscription.active for new subscriptions)
    if (!current && eventType === 'subscription.active') {
      console.log(`[WebhookProcessor] New subscription detected, handling creation`);
      return this.handleNewSubscription(tx, headers, payload, subscription);
    }

    // If no existing subscription and not a new subscription event, skip
    if (!current) {
      console.log(`[WebhookProcessor] SKIP: No existing subscription found for ${subscriptionId}`);
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

    console.log(
      `[WebhookProcessor] Found subscription: status=${current.status}, periodEnd=${current.currentPeriodEnd}`
    );

    // 4. Out-of-order detection
    const isStale = this.isStaleWebhook(current, subscription, eventTimestamp);
    if (isStale) {
      console.log(`[WebhookProcessor] SKIP: Stale webhook detected (out-of-order)`);
      console.log(`[WebhookProcessor] - Event timestamp: ${eventTimestamp}`);
      console.log(`[WebhookProcessor] - Last webhook timestamp: ${current.lastWebhookTimestamp}`);
      console.log(`[WebhookProcessor] - Incoming period end: ${subscription.next_billing_date}`);
      console.log(`[WebhookProcessor] - Current period end: ${current.currentPeriodEnd}`);
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
    console.log(`[WebhookProcessor] Reading target status from subscription payload`);
    let targetStatus = subscription.status;

    if (!targetStatus) {
      console.log(`[WebhookProcessor] SKIP: No status in subscription payload`);
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

    console.log(
      `[WebhookProcessor] Target status: ${targetStatus}, Current status: ${current.status}`
    );

    // 6. State machine validation
    console.log(`[WebhookProcessor] Validating transition: ${current.status} → ${targetStatus}`);
    const validation = validateTransition(
      current.status as SubscriptionStatus,
      targetStatus,
      current.cancelAtPeriodEnd
    );

    if (!validation.valid) {
      console.log(`[WebhookProcessor] Transition invalid: ${validation.reason}`);
      console.log(`[WebhookProcessor] Attempting upstream verification...`);

      // Try upstream verification for ambiguous cases
      const upstreamStatus = await this.verifyUpstream(subscriptionId);

      if (upstreamStatus) {
        console.log(`[WebhookProcessor] Upstream status: ${upstreamStatus}`);
        const upstreamValidation = validateTransition(
          current.status as SubscriptionStatus,
          upstreamStatus,
          current.cancelAtPeriodEnd
        );

        if (upstreamValidation.valid) {
          // Use upstream status instead
          console.log(`[WebhookProcessor] Using upstream status: ${upstreamStatus}`);
          targetStatus = upstreamStatus;
        } else {
          // Both webhook and upstream are invalid
          console.log(`[WebhookProcessor] SKIP: Both webhook and upstream transitions invalid`);
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
        console.log(`[WebhookProcessor] SKIP: Upstream verification failed, rejecting transition`);
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
    console.log(`[WebhookProcessor] Applying transition: ${current.status} → ${targetStatus}`);
    console.log(`[WebhookProcessor] - Plan ID: ${planId}`);
    console.log(
      `[WebhookProcessor] - Period: ${dates.currentPeriodStart} to ${dates.currentPeriodEnd}`
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
        console.log(`[WebhookProcessor] Resetting period usage for workspace: ${workspaceId}`);
        await this.deps.entitlementService.resetPeriodUsage(workspaceId, { tx });
      }

      // Handle plan changes
      if (planId && planId !== current.planId) {
        console.log(
          `[WebhookProcessor] Updating entitlements for plan change: ${current.planId} → ${planId}`
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

    console.log(`[WebhookProcessor] SUCCESS: ${current.status} → ${targetStatus}`);

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

    console.log(`[WebhookProcessor] handleNewSubscription: ${subscriptionId}`);

    // Extract workspace ID from metadata
    const workspaceId = subscription.metadata?.workspace_id || subscription.metadata?.workspaceId;

    console.log(`[WebhookProcessor] - Workspace ID from metadata: ${workspaceId}`);
    console.log(`[WebhookProcessor] - Product ID: ${subscription.product_id}, Plan ID: ${planId}`);

    if (!workspaceId) {
      console.log(`[WebhookProcessor] SKIP: No workspace_id in metadata`);
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
      console.log(`[WebhookProcessor] SKIP: Unknown product ID ${subscription.product_id}`);
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
    console.log(`[WebhookProcessor] Checking for existing workspace subscription`);
    const existingWorkspaceSubscription =
      await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (existingWorkspaceSubscription) {
      console.log(
        `[WebhookProcessor] Workspace has existing subscription: ${existingWorkspaceSubscription.subscriptionId}`
      );
      console.log(`[WebhookProcessor] Updating existing subscription (plan change scenario)`);

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
        console.log(
          `[WebhookProcessor] Subscription ID changed: ${existingWorkspaceSubscription.subscriptionId} → ${subscriptionId}`
        );
        const { subscriptions } = await import('@workspace/db');
        const { eq } = await import('@workspace/db');

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
      console.log(`[WebhookProcessor] Updating entitlements for plan change to: ${planId}`);
      await this.deps.entitlementService.updateForPlan(workspaceId, planId as PlanId, { tx });

      console.log(
        `[WebhookProcessor] SUCCESS: Updated existing subscription ${existingWorkspaceSubscription.status} → active`
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
    console.log(`[WebhookProcessor] Creating new subscription for workspace: ${workspaceId}`);
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
    console.log(`[WebhookProcessor] Updating workspace customer ID: ${customerId}`);
    await this.updateWorkspaceCustomerId(workspaceId, customerId, { tx });

    // Provision entitlements for the new plan
    // This updates existing free plan entitlements to the paid plan limits
    console.log(`[WebhookProcessor] Provisioning entitlements for plan: ${planId}`);
    await this.deps.entitlementService.updateForPlan(workspaceId, planId as PlanId, { tx });

    await this.deps.webhookEventsRepo.markProcessed(
      webhookId,
      {
        previousStatus: undefined,
        newStatus: 'active',
      },
      { tx }
    );

    console.log(`[WebhookProcessor] SUCCESS: Created new subscription → active`);

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
    // Compare with last processed webhook timestamp
    if (current.lastWebhookTimestamp && eventTimestamp < current.lastWebhookTimestamp) {
      return true;
    }

    // Compare billing periods (incoming older = stale)
    const incomingPeriodEnd = new Date(incoming.next_billing_date);
    if (incomingPeriodEnd < current.currentPeriodEnd) {
      return true;
    }

    return false;
  }

  /**
   * Verify subscription status from upstream DodoPayments API
   */
  private async verifyUpstream(subscriptionId: string): Promise<SubscriptionStatus | null> {
    if (!this.deps.dodoClient) {
      console.warn('[WebhookProcessor] No DodoPayments client available for upstream verification');
      return null;
    }

    try {
      const upstream = await this.deps.dodoClient.subscriptions.retrieve(subscriptionId);
      return upstream.status;
    } catch (error) {
      console.error(
        `[WebhookProcessor] Upstream verification failed for ${subscriptionId}:`,
        error
      );
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

    const { workspaces } = await import('@workspace/db');
    const { eq } = await import('@workspace/db');

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
}
