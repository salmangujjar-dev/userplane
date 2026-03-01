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

import type { CacheService } from '@userplane/cache';
import type { DbClient } from '@userplane/db';
import type { getDodoPaymentsClient } from '@userplane/payments/client';
import type { DodoRefund, RefundEventType, WebhookPayload } from '@userplane/payments/types';

import { createLogger } from '@/api/lib/logger';
import type { RefundRepository } from '@/api/repositories/refunds.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';

import { captureException } from '../posthog';

const logger = createLogger('refund-processor');

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

    logger.debug({ webhookId }, 'Processing webhook');
    logger.debug({ eventType, refundId: refund.refund_id }, 'Event details');

    // 1. Idempotency check
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      logger.debug({ webhookId }, 'Webhook already processed (idempotency)');
      return {
        processed: false,
        skipped: true,
        skipReason: 'Already processed',
        refundId: refund.refund_id,
      };
    }

    // 2. Record webhook event for audit trail
    const existingEvent = await this.deps.webhookEventsRepo.exists(webhookId);
    const businessId = refund.business_id;

    if (!existingEvent) {
      logger.debug({ webhookId }, 'Recording new webhook event');
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
      logger.debug({ paymentId: refund.payment_id }, 'Looking up payment');
      const payment = await this.deps.dodoClient.payments.retrieve(refund.payment_id);
      subscriptionId = payment.subscription_id || null;
      logger.debug({ subscriptionId }, 'Payment mapped to subscription');
    } catch (error) {
      logger.warn({ err: error, paymentId: refund.payment_id }, 'Failed to retrieve payment');
      captureException(error, undefined, {
        operation: 'refund_processing',
        subscriptionId,
        paymentId: refund.payment_id,
      });
      // Continue processing - we can still record the refund
    }

    // 4. Get workspace from subscription (if we have a subscription)
    let workspaceId: string | null = null;

    if (subscriptionId) {
      const subscription = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId);
      workspaceId = subscription?.workspaceId || null;
      logger.debug({ workspaceId }, 'Subscription mapped to workspace');
    }

    // 5. Determine refund status from event type
    const status = eventType === 'refund.succeeded' ? 'succeeded' : 'failed';
    logger.debug({ status, eventType }, 'Refund status');

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
          logger.debug({ workspaceId }, 'Invalidated refund cache for workspace');
        } catch (cacheError) {
          logger.warn({ err: cacheError, workspaceId }, 'Failed to invalidate cache for workspace');
          captureException(cacheError, undefined, {
            operation: 'refund_cache_processing',
            subscriptionId,
            paymentId: refund.payment_id,
          });
        }
      }

      logger.debug({ eventType, refundId: refund.refund_id }, 'Successfully processed refund');

      return {
        processed: true,
        skipped: false,
        refundId: refund.refund_id,
        subscriptionId,
        workspaceId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, errorMessage }, 'Error processing refund');
      await this.deps.webhookEventsRepo.markFailed(webhookId, { error: errorMessage });
      throw error;
    }
  }
}
