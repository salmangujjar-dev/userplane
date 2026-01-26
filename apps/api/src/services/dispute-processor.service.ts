/**
 * DisputeProcessorService - Processes Dodo Payments dispute webhooks
 *
 * Handles dispute lifecycle events to control entitlement access:
 * - dispute.opened → blocks entitlements (isOpen: true)
 * - dispute.challenged → keeps entitlements blocked (isOpen: true)
 * - dispute.won/lost/cancelled/expired/accepted → unblocks entitlements (isOpen: false)
 *
 * Key design decisions:
 * - Disputes are tracked separately from subscriptions
 * - Open disputes override subscription entitlements (hard safety latch)
 * - Payment ID is used to map to subscription via Dodo API
 * - Cache invalidation on dispute state changes
 */

import type { CacheService } from '@workspace/cache';
import type { DbClient } from '@workspace/db';
import type { getDodoPaymentsClient } from '@workspace/payments/client';
import type { DisputeEventType, DodoDispute, WebhookPayload } from '@workspace/payments/types';
import { isDisputeResolutionEvent } from '@workspace/payments/types';

import type { DisputeRepository } from '@/api/repositories/disputes.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';

/**
 * Webhook headers from DodoPayments
 */
export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
}

/**
 * Result of dispute processing
 */
export interface DisputeProcessingResult {
  processed: boolean;
  skipped: boolean;
  skipReason?: string;
  disputeId?: string;
  subscriptionId?: string | null;
  workspaceId?: string | null;
  error?: string;
}

export interface DisputeProcessorDeps {
  disputeRepo: DisputeRepository;
  subscriptionRepo: SubscriptionRepository;
  webhookEventsRepo: WebhookEventsRepository;
  db: DbClient;
  dodoClient?: ReturnType<typeof getDodoPaymentsClient>;
  cacheService?: CacheService;
}

export class DisputeProcessorService {
  constructor(private deps: DisputeProcessorDeps) {}

  /**
   * Process a dispute webhook event
   */
  async processDispute(
    headers: WebhookHeaders,
    payload: WebhookPayload
  ): Promise<DisputeProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventType = payload.type as DisputeEventType;
    // webhook-timestamp header is Unix seconds, convert to milliseconds for Date
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);
    // Cast to unknown first since WebhookPayload.data type doesn't include disputes
    const dispute = payload.data as unknown as DodoDispute;

    console.log(`[DisputeProcessor] Processing webhook: ${webhookId}`);
    console.log(`[DisputeProcessor] Event type: ${eventType}, dispute: ${dispute.dispute_id}`);

    // 1. Idempotency check
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      console.log(`[DisputeProcessor] SKIP: Webhook ${webhookId} already processed (idempotency)`);
      return {
        processed: false,
        skipped: true,
        skipReason: 'Already processed',
        disputeId: dispute.dispute_id,
      };
    }

    // 2. Record webhook event for audit trail
    const existingEvent = await this.deps.webhookEventsRepo.exists(webhookId);
    const businessId = dispute.business_id || 'unknown';

    if (!existingEvent) {
      console.log(`[DisputeProcessor] Recording new webhook event: ${webhookId}`);
      await this.deps.webhookEventsRepo.create({
        id: webhookId,
        eventType,
        businessId,
        eventTimestamp,
        subscriptionId: undefined, // Will be determined below
        customerId: undefined, // Not directly on dispute payload
        payload: payload as unknown as Record<string, unknown>,
      });
    }

    // 3. Map payment_id → subscription_id via Dodo API
    let subscriptionId: string | null = null;

    if (this.deps.dodoClient) {
      try {
        console.log(`[DisputeProcessor] Looking up payment: ${dispute.payment_id}`);
        const payment = await this.deps.dodoClient.payments.retrieve(dispute.payment_id);
        subscriptionId = payment.subscription_id || null;
        console.log(`[DisputeProcessor] Payment mapped to subscription: ${subscriptionId}`);
      } catch (error) {
        console.warn(`[DisputeProcessor] Failed to retrieve payment ${dispute.payment_id}:`, error);
        // Continue processing - we can still record the dispute
      }
    } else {
      console.warn('[DisputeProcessor] No Dodo client available for payment lookup');
    }

    // 4. Get workspace from subscription (if we have a subscription)
    let workspaceId: string | null = null;

    if (subscriptionId) {
      const subscription = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId);
      workspaceId = subscription?.workspaceId || null;
      console.log(`[DisputeProcessor] Subscription mapped to workspace: ${workspaceId}`);
    }

    // 5. Determine if dispute is open or resolved
    const isOpen = !isDisputeResolutionEvent(eventType);
    console.log(`[DisputeProcessor] Dispute isOpen: ${isOpen} (event: ${eventType})`);

    // 6. Record/update dispute in transaction
    try {
      // Parse amount from string to cents (Dodo returns amount as string)
      const amountCents = Math.round(parseFloat(dispute.amount) * 100);

      await this.deps.db.transaction(async (tx) => {
        // Upsert dispute record
        await this.deps.disputeRepo.upsert(
          {
            disputeId: dispute.dispute_id,
            paymentId: dispute.payment_id,
            subscriptionId,
            workspaceId,
            amount: amountCents,
            status: dispute.dispute_status,
            stage: dispute.dispute_stage,
            remarks: dispute.remarks ?? null,
            isOpen,
            resolvedAt: isOpen ? null : new Date(),
          },
          { tx }
        );

        // Mark webhook as processed
        await this.deps.webhookEventsRepo.markProcessed(
          webhookId,
          {
            previousStatus: undefined,
            newStatus: dispute.dispute_status,
          },
          { tx }
        );
      });

      // Invalidate dispute cache for this workspace
      if (workspaceId && this.deps.cacheService) {
        try {
          await this.deps.cacheService.invalidateDispute(workspaceId);
          console.log(`[DisputeProcessor] Invalidated dispute cache for workspace: ${workspaceId}`);
        } catch (cacheError) {
          console.warn(
            `[DisputeProcessor] Failed to invalidate cache for workspace ${workspaceId}:`,
            cacheError
          );
        }
      }

      console.log(
        `[DisputeProcessor] SUCCESS: Processed ${eventType} for dispute ${dispute.dispute_id}`
      );

      return {
        processed: true,
        skipped: false,
        disputeId: dispute.dispute_id,
        subscriptionId,
        workspaceId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[DisputeProcessor] ERROR processing dispute: ${errorMessage}`);
      await this.deps.webhookEventsRepo.markFailed(webhookId, { error: errorMessage });
      throw error;
    }
  }
}
