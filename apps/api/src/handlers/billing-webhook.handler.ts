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

import * as Sentry from '@sentry/node';
import type { WebhookPayload } from '@workspace/payments/types';
import { isDisputeEvent, isRefundEvent, isSubscriptionEvent } from '@workspace/payments/webhooks';
import { buildWebhookTags, type WebhookContext } from '@workspace/sentry';

import { createLogger } from '@/api/lib/logger';
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

    // Set webhook context for Sentry
    const webhookCtx: WebhookContext = {
      webhookId: webhookHeaders.webhookId,
      eventType,
      timestamp: webhookHeaders.webhookTimestamp,
    };
    Sentry.setContext('webhook', webhookCtx);

    // Route subscription events to webhook processor
    if (isSubscriptionEvent(eventType)) {
      logger.info(
        { eventType, webhookId: webhookHeaders.webhookId },
        'Processing subscription event'
      );

      try {
        const result = await Sentry.startSpan(
          {
            name: 'webhook.process.subscription',
            op: 'webhook',
            attributes: {
              'webhook.type': eventType,
              'webhook.id': webhookHeaders.webhookId,
            },
          },
          async () => {
            return await webhookProcessor.processWebhook(webhookHeaders, webhookPayload);
          }
        );

        if (result.skipped) {
          logger.info(
            { eventType, skipReason: result.skipReason, subscriptionId: result.subscriptionId },
            'Skipped subscription event'
          );
        } else if (result.processed) {
          logger.info(
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
        Sentry.captureException(error, {
          tags: buildWebhookTags({
            webhookType: 'subscription',
            eventType,
          }),
        });
        throw error;
      }
      return;
    }

    // Route dispute events to dispute processor
    if (isDisputeEvent(eventType)) {
      logger.info({ eventType, webhookId: webhookHeaders.webhookId }, 'Processing dispute event');

      try {
        const result = await Sentry.startSpan(
          {
            name: 'webhook.process.dispute',
            op: 'webhook',
            attributes: {
              'webhook.type': eventType,
              'webhook.id': webhookHeaders.webhookId,
            },
          },
          async () => {
            return await disputeProcessor.processDispute(webhookHeaders, webhookPayload);
          }
        );

        if (result.skipped) {
          logger.info(
            { eventType, skipReason: result.skipReason, disputeId: result.disputeId },
            'Skipped dispute event'
          );
        } else if (result.processed) {
          logger.info(
            { eventType, disputeId: result.disputeId, workspaceId: result.workspaceId },
            'Processed dispute event'
          );
        }
      } catch (error) {
        logger.error({ err: error, eventType }, 'Error processing dispute event');
        Sentry.captureException(error, {
          tags: buildWebhookTags({
            webhookType: 'dispute',
            eventType,
          }),
        });
        throw error;
      }
      return;
    }

    // Route refund events to refund processor
    if (isRefundEvent(eventType)) {
      logger.info({ eventType, webhookId: webhookHeaders.webhookId }, 'Processing refund event');

      try {
        const result = await Sentry.startSpan(
          {
            name: 'webhook.process.refund',
            op: 'webhook',
            attributes: {
              'webhook.type': eventType,
              'webhook.id': webhookHeaders.webhookId,
            },
          },
          async () => {
            return await refundProcessor.processRefund(webhookHeaders, webhookPayload);
          }
        );

        if (result.skipped) {
          logger.info(
            { eventType, skipReason: result.skipReason, refundId: result.refundId },
            'Skipped refund event'
          );
        } else if (result.processed) {
          logger.info(
            { eventType, refundId: result.refundId, workspaceId: result.workspaceId },
            'Processed refund event'
          );
        }
      } catch (error) {
        logger.error({ err: error, eventType }, 'Error processing refund event');
        Sentry.captureException(error, {
          tags: buildWebhookTags({
            webhookType: 'refund',
            eventType,
          }),
        });
        throw error;
      }
      return;
    }

    // Unknown event type - log and ignore
    logger.info({ eventType }, 'Ignoring unknown event');
  };
}
