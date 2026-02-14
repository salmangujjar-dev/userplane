/**
 * Billing Webhook Handler
 *
 * Processes DodoPayments webhook events using the WebhookProcessorService.
 * Provides production-ready handling with:
 * - Idempotency (duplicate detection)
 * - State machine validation
 * - Out-of-order protection
 * - Upstream verification
 * - Audit trail
 *
 * Routes events to appropriate processors:
 * - Subscription events → WebhookProcessorService
 * - Dispute events → DisputeProcessorService
 * - Refund events → RefundProcessorService
 */

import type { WebhookPayload } from '@workspace/payments/types';
import { isDisputeEvent, isRefundEvent, isSubscriptionEvent } from '@workspace/payments/webhooks';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { DisputeProcessorService } from '@/api/services/dispute-processor.service';
import type { RefundProcessorService } from '@/api/services/refund-processor.service';
import type { WebhookProcessorService } from '@/api/services/webhook-processor.service';
import { determineWebhookHeaders, type WebhookHeaders } from '@/api/utils/webhook';

const logger = createLogger('billing-webhook');

export interface BillingWebhookHandlerDeps {
  webhookProcessor: WebhookProcessorService;
  disputeProcessor: DisputeProcessorService;
  refundProcessor: RefundProcessorService;
}

/**
 * Create the webhook handler function for DodoPayments
 *
 * @param deps - Dependencies including webhook and dispute processors
 * @returns Handler function that accepts payload and headers
 */
export function createBillingWebhookHandler(deps: BillingWebhookHandlerDeps) {
  const { webhookProcessor, disputeProcessor, refundProcessor } = deps;

  return async (payload: unknown, headers?: WebhookHeaders): Promise<void> => {
    const webhookPayload = payload as WebhookPayload;
    const { type: eventType } = webhookPayload;
    const webhookHeaders = determineWebhookHeaders(webhookPayload, headers);

    // Route subscription events to webhook processor
    if (isSubscriptionEvent(eventType)) {
      logger.debug(
        { eventType, webhookId: webhookHeaders.webhookId },
        'Processing subscription event'
      );

      try {
        const result = await webhookProcessor.processWebhook(webhookHeaders, webhookPayload);

        if (result.skipped) {
          logger.warn(
            { eventType, skipReason: result.skipReason, subscriptionId: result.subscriptionId },
            'Skipped subscription event'
          );
        } else if (result.processed) {
          logger.debug(
            {
              eventType,
              previousStatus: result.previousStatus || 'new',
              newStatus: result.newStatus,
              subscriptionId: result.subscriptionId,
            },
            'Processed subscription event'
          );
        }
      } catch (error) {
        logger.error({ err: error, eventType }, 'Error processing subscription event');
        captureException(error, undefined, {
          webhook_type: 'subscription',
          event_type: eventType,
          webhook_id: webhookHeaders.webhookId,
          webhook_timestamp: webhookHeaders.webhookTimestamp,
        });
        throw error;
      }
      return;
    }

    // Route dispute events to dispute processor
    if (isDisputeEvent(eventType)) {
      logger.debug({ eventType, webhookId: webhookHeaders.webhookId }, 'Processing dispute event');

      try {
        const result = await disputeProcessor.processDispute(webhookHeaders, webhookPayload);

        if (result.skipped) {
          logger.warn(
            { eventType, skipReason: result.skipReason, disputeId: result.disputeId },
            'Skipped dispute event'
          );
        } else if (result.processed) {
          logger.debug(
            { eventType, disputeId: result.disputeId, workspaceId: result.workspaceId },
            'Processed dispute event'
          );
        }
      } catch (error) {
        logger.error({ err: error, eventType }, 'Error processing dispute event');
        captureException(error, undefined, {
          webhook_type: 'dispute',
          event_type: eventType,
          webhook_id: webhookHeaders.webhookId,
          webhook_timestamp: webhookHeaders.webhookTimestamp,
        });
        throw error;
      }
      return;
    }

    // Route refund events to refund processor
    if (isRefundEvent(eventType)) {
      logger.debug({ eventType, webhookId: webhookHeaders.webhookId }, 'Processing refund event');

      try {
        const result = await refundProcessor.processRefund(webhookHeaders, webhookPayload);

        if (result.skipped) {
          logger.warn(
            { eventType, skipReason: result.skipReason, refundId: result.refundId },
            'Skipped refund event'
          );
        } else if (result.processed) {
          logger.debug(
            { eventType, refundId: result.refundId, workspaceId: result.workspaceId },
            'Processed refund event'
          );
        }
      } catch (error) {
        logger.error({ err: error, eventType }, 'Error processing refund event');
        captureException(error, undefined, {
          webhook_type: 'refund',
          event_type: eventType,
          webhook_id: webhookHeaders.webhookId,
          webhook_timestamp: webhookHeaders.webhookTimestamp,
        });
        throw error;
      }
      return;
    }

    // Unknown event type - log and ignore
    logger.warn({ eventType }, 'Ignoring unknown event');
  };
}
