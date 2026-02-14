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

import { createLogger } from '@/api/lib/logger';
import type { DisputeRepository } from '@/api/repositories/disputes.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';

import { captureException } from '../posthog';

const logger = createLogger('dispute-processor');

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
  dodoClient: ReturnType<typeof getDodoPaymentsClient>;
  cacheService: CacheService;
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

    logger.debug(
      { webhookId, eventType, disputeId: dispute.dispute_id },
      'Processing dispute webhook'
    );

    // 1. Idempotency check
    const alreadyProcessed = await this.deps.webhookEventsRepo.isProcessed(webhookId);
    if (alreadyProcessed) {
      logger.debug({ webhookId }, 'Skipping already processed webhook (idempotency)');
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
      logger.debug({ webhookId }, 'Recording new webhook event');
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

    try {
      logger.debug({ paymentId: dispute.payment_id }, 'Looking up payment');
      const payment = await this.deps.dodoClient.payments.retrieve(dispute.payment_id);
      subscriptionId = payment.subscription_id || null;
      logger.debug(
        { paymentId: dispute.payment_id, subscriptionId },
        'Payment mapped to subscription'
      );
    } catch (error) {
      logger.warn({ paymentId: dispute.payment_id, err: error }, 'Failed to retrieve payment');
      captureException(error, undefined, {
        operation: 'dispute_processing',
        subscriptionId,
        paymentId: dispute.payment_id,
      });
      // Continue processing - we can still record the dispute
    }

    // 4. Get workspace from subscription (if we have a subscription)
    let workspaceId: string | null = null;

    if (subscriptionId) {
      const subscription = await this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId);
      workspaceId = subscription?.workspaceId || null;
      logger.debug({ subscriptionId, workspaceId }, 'Subscription mapped to workspace');
    }

    // 5. Determine if dispute is open or resolved
    const isOpen = !isDisputeResolutionEvent(eventType);
    logger.debug({ disputeId: dispute.dispute_id, isOpen, eventType }, 'Determined dispute state');

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
      if (workspaceId) {
        try {
          await this.deps.cacheService.invalidateDispute(workspaceId);
          logger.debug({ workspaceId }, 'Invalidated dispute cache for workspace');
        } catch (cacheError) {
          logger.warn({ workspaceId, err: cacheError }, 'Failed to invalidate cache for workspace');
          captureException(cacheError, undefined, {
            operation: 'invalidate_dispute_cache',
            workspaceId,
          });
        }
      }

      logger.debug(
        { disputeId: dispute.dispute_id, eventType },
        'Successfully processed dispute webhook'
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
      logger.error({ webhookId, err: errorMessage }, 'Error processing dispute');
      await this.deps.webhookEventsRepo.markFailed(webhookId, { error: errorMessage });
      throw error;
    }
  }
}
