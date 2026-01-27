/**
 * RefundProcessorService - Processes Dodo Payments refund webhooks
 *
 * Handles refund lifecycle events:
 * - refund.succeeded → records successful refund
 * - refund.failed → records failed refund attempt
 *
 * Key design decisions:
 * - Refunds are tracked separately from subscriptions
 * - Payment ID is used to map to subscription via Dodo API
 * - Cache invalidation on refund state changes
 */

import type { CacheService } from '@workspace/cache';
import type { DbClient } from '@workspace/db';
import type { getDodoPaymentsClient } from '@workspace/payments/client';
import type { DodoRefund, RefundEventType, WebhookPayload } from '@workspace/payments/types';

import type { RefundRepository } from '@/api/repositories/refunds.repository';
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
 * Result of refund processing
 */
export interface RefundProcessingResult {
  processed: boolean;
  skipped: boolean;
  skipReason?: string;
  refundId?: string;
  subscriptionId?: string | null;
  workspaceId?: string | null;
  error?: string;
}

export interface RefundProcessorDeps {
  refundRepo: RefundRepository;
  subscriptionRepo: SubscriptionRepository;
  webhookEventsRepo: WebhookEventsRepository;
  db: DbClient;
  dodoClient: ReturnType<typeof getDodoPaymentsClient>;
  cacheService: CacheService;
}

export class RefundProcessorService {
  constructor(private deps: RefundProcessorDeps) {}

  /**
   * Process a refund webhook event
   */
  async processRefund(
    headers: WebhookHeaders,
    payload: WebhookPayload
  ): Promise<RefundProcessingResult> {
    const { webhookId, webhookTimestamp } = headers;
    const eventType = payload.type as RefundEventType;
    // webhook-timestamp header is Unix seconds, convert to milliseconds for Date
    const eventTimestamp = new Date(parseInt(webhookTimestamp, 10) * 1000);
    // Cast to unknown first since WebhookPayload.data type doesn't include refunds
    const refund = payload.data as unknown as DodoRefund;

    console.log(`[RefundProcessor] Processing webhook: ${webhookId}`);
    console.log(`[RefundProcessor] Event type: ${eventType}, refund: ${refund.refund_id}`);

    // 1. Idempotency check
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      console.log(`[RefundProcessor] SKIP: Webhook ${webhookId} already processed (idempotency)`);
      return {
        processed: false,
        skipped: true,
        skipReason: 'Already processed',
        refundId: refund.refund_id,
      };
    }

    // 2. Record webhook event for audit trail
    const existingEvent = await this.deps.webhookEventsRepo.exists(webhookId);
    const businessId = refund.business_id || 'unknown';

    if (!existingEvent) {
      console.log(`[RefundProcessor] Recording new webhook event: ${webhookId}`);
      await this.deps.webhookEventsRepo.create({
        id: webhookId,
        eventType,
        businessId,
        eventTimestamp,
        subscriptionId: undefined, // Will be determined below
        customerId: undefined, // Not directly on refund payload
        payload: payload as unknown as Record<string, unknown>,
      });
    }

    // 3. Map payment_id → subscription_id via Dodo API
    let subscriptionId: string | null = null;

    try {
      console.log(`[RefundProcessor] Looking up payment: ${refund.payment_id}`);
      const payment = await this.deps.dodoClient.payments.retrieve(refund.payment_id);
      subscriptionId = payment.subscription_id || null;
      console.log(`[RefundProcessor] Payment mapped to subscription: ${subscriptionId}`);
    } catch (error) {
      console.warn(`[RefundProcessor] Failed to retrieve payment ${refund.payment_id}:`, error);
      // Continue processing - we can still record the refund
    }

    // 4. Get workspace from subscription (if we have a subscription)
    let workspaceId: string | null = null;

    if (subscriptionId) {
      const subscription = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId);
      workspaceId = subscription?.workspaceId || null;
      console.log(`[RefundProcessor] Subscription mapped to workspace: ${workspaceId}`);
    }

    // 5. Determine refund status from event type
    const status = eventType === 'refund.succeeded' ? 'succeeded' : 'failed';
    console.log(`[RefundProcessor] Refund status: ${status} (event: ${eventType})`);

    // 6. Record/update refund in transaction
    try {
      // Parse amount to cents (Dodo may return amount as string or number)
      const rawAmount = refund.amount ?? 0;
      const amountCents = Math.round(
        (typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount) * 100
      );

      await this.deps.db.transaction(async (tx) => {
        // Upsert refund record
        await this.deps.refundRepo.upsert(
          {
            refundId: refund.refund_id,
            paymentId: refund.payment_id,
            subscriptionId,
            workspaceId,
            amount: amountCents,
            status,
            reason: refund.reason ?? null,
          },
          { tx }
        );

        // Mark webhook as processed
        await this.deps.webhookEventsRepo.markProcessed(
          webhookId,
          {
            previousStatus: undefined,
            newStatus: status,
          },
          { tx }
        );
      });

      // Invalidate refund cache for this workspace (only for successful refunds)
      if (workspaceId && status === 'succeeded') {
        try {
          await this.deps.cacheService.invalidateRefund(workspaceId);
          console.log(`[RefundProcessor] Invalidated refund cache for workspace: ${workspaceId}`);
        } catch (cacheError) {
          console.warn(
            `[RefundProcessor] Failed to invalidate cache for workspace ${workspaceId}:`,
            cacheError
          );
        }
      }

      console.log(
        `[RefundProcessor] SUCCESS: Processed ${eventType} for refund ${refund.refund_id}`
      );

      return {
        processed: true,
        skipped: false,
        refundId: refund.refund_id,
        subscriptionId,
        workspaceId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[RefundProcessor] ERROR processing refund: ${errorMessage}`);
      await this.deps.webhookEventsRepo.markFailed(webhookId, { error: errorMessage });
      throw error;
    }
  }
}
