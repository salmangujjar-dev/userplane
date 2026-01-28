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

import * as Sentry from '@sentry/bun';
import type { WebhookPayload } from '@workspace/payments/types';
import { isDisputeEvent, isRefundEvent, isSubscriptionEvent } from '@workspace/payments/webhooks';

import type { DisputeProcessorService } from '@/api/services/dispute-processor.service';
import type { RefundProcessorService } from '@/api/services/refund-processor.service';
import type { WebhookProcessorService } from '@/api/services/webhook-processor.service';
import { determineWebhookHeaders, type WebhookHeaders } from '@/api/utils/webhook';

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
    Sentry.setContext('webhook', {
      webhookId: webhookHeaders.webhookId,
      eventType,
      timestamp: webhookHeaders.webhookTimestamp,
    });

    // Route subscription events to webhook processor
    if (isSubscriptionEvent(eventType)) {
      console.log(
        `[Billing Webhook] Processing subscription event: ${eventType} (webhook: ${webhookHeaders.webhookId})`
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
          console.log(
            `[Billing Webhook] Skipped ${eventType}: ${result.skipReason}` +
              (result.subscriptionId ? ` (subscription: ${result.subscriptionId})` : '')
          );
        } else if (result.processed) {
          console.log(
            `[Billing Webhook] Processed ${eventType}: ${result.previousStatus || 'new'} → ${result.newStatus}` +
              (result.subscriptionId ? ` (subscription: ${result.subscriptionId})` : '')
          );
        }
      } catch (error) {
        console.error(`[Billing Webhook] Error processing ${eventType}:`, error);
        Sentry.captureException(error, {
          tags: {
            webhook_type: 'subscription',
            event_type: eventType,
          },
        });
        throw error;
      }
      return;
    }

    // Route dispute events to dispute processor
    if (isDisputeEvent(eventType)) {
      console.log(
        `[Billing Webhook] Processing dispute event: ${eventType} (webhook: ${webhookHeaders.webhookId})`
      );

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
          console.log(
            `[Billing Webhook] Skipped ${eventType}: ${result.skipReason}` +
              (result.disputeId ? ` (dispute: ${result.disputeId})` : '')
          );
        } else if (result.processed) {
          console.log(
            `[Billing Webhook] Processed ${eventType} for dispute: ${result.disputeId}` +
              (result.workspaceId ? ` (workspace: ${result.workspaceId})` : '')
          );
        }
      } catch (error) {
        console.error(`[Billing Webhook] Error processing ${eventType}:`, error);
        Sentry.captureException(error, {
          tags: {
            webhook_type: 'dispute',
            event_type: eventType,
          },
        });
        throw error;
      }
      return;
    }

    // Route refund events to refund processor
    if (isRefundEvent(eventType)) {
      console.log(
        `[Billing Webhook] Processing refund event: ${eventType} (webhook: ${webhookHeaders.webhookId})`
      );

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
          console.log(
            `[Billing Webhook] Skipped ${eventType}: ${result.skipReason}` +
              (result.refundId ? ` (refund: ${result.refundId})` : '')
          );
        } else if (result.processed) {
          console.log(
            `[Billing Webhook] Processed ${eventType} for refund: ${result.refundId}` +
              (result.workspaceId ? ` (workspace: ${result.workspaceId})` : '')
          );
        }
      } catch (error) {
        console.error(`[Billing Webhook] Error processing ${eventType}:`, error);
        Sentry.captureException(error, {
          tags: {
            webhook_type: 'refund',
            event_type: eventType,
          },
        });
        throw error;
      }
      return;
    }

    // Unknown event type - log and ignore
    console.log(`[Billing Webhook] Ignoring unknown event: ${eventType}`);
  };
}
