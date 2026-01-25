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
 */

import type { WebhookPayload } from '@workspace/payments/types';
import { isSubscriptionEvent } from '@workspace/payments/webhooks';

import type {
  WebhookHeaders,
  WebhookProcessorService,
} from '@/api/services/webhook-processor.service';

export interface BillingWebhookHandlerDeps {
  webhookProcessor: WebhookProcessorService;
}

/**
 * Create the webhook handler function for DodoPayments
 *
 * @param deps - Dependencies including the webhook processor
 * @returns Handler function that accepts payload and headers
 */
export function createBillingWebhookHandler(deps: BillingWebhookHandlerDeps) {
  const { webhookProcessor } = deps;

  return async (payload: unknown, headers?: WebhookHeaders): Promise<void> => {
    const webhookPayload = payload as WebhookPayload;
    const { type: eventType } = webhookPayload;

    // Skip non-subscription events early
    if (!isSubscriptionEvent(eventType)) {
      console.log(`[Billing Webhook] Ignoring non-subscription event: ${eventType}`);
      return;
    }

    // If no headers provided, generate fallback (for backward compatibility)
    const webhookHeaders: WebhookHeaders = headers || {
      webhookId: `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      webhookTimestamp: new Date().toISOString(),
    };

    console.log(
      `[Billing Webhook] Processing event: ${eventType} (webhook: ${webhookHeaders.webhookId})`
    );

    try {
      const result = await webhookProcessor.processWebhook(webhookHeaders, webhookPayload);

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
      throw error;
    }
  };
}
