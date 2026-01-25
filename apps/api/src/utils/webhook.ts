/**
 * Webhook Utilities
 *
 * Helper functions for webhook header resolution and fallback generation.
 */

import type { DodoDispute, DodoSubscription, WebhookPayload } from '@workspace/payments/types';
import { isDisputeEvent, isSubscriptionEvent } from '@workspace/payments/webhooks';

export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
}

/**
 * Extract resource ID from webhook payload based on event type
 */
function extractResourceId(eventType: string, data: unknown): string {
  if (isSubscriptionEvent(eventType)) {
    const subscription = data as DodoSubscription;
    return subscription.subscription_id || 'unknown';
  }
  if (isDisputeEvent(eventType)) {
    const dispute = data as unknown as DodoDispute;
    return dispute.dispute_id || 'unknown';
  }
  return 'unknown';
}

/**
 * Generate a deterministic fallback webhook ID from payload fields.
 * Format: fallback:{event_type}:{resource_id}:{timestamp}
 */
function generateFallbackWebhookId(payload: WebhookPayload): string {
  const resourceId = extractResourceId(payload.type, payload.data);
  const timestamp = payload.timestamp || new Date().toISOString();
  return `fallback:${payload.type}:${resourceId}:${timestamp}`;
}

/**
 * Determine webhook headers from provided headers or generate deterministic fallback.
 *
 * Prefers canonical webhook-id header from Dodo Payments.
 * Falls back to deterministic ID (same payload = same ID) for idempotency.
 * Logs warning when fallback is used.
 */
export function determineWebhookHeaders(
  payload: WebhookPayload,
  headers?: WebhookHeaders
): WebhookHeaders {
  if (headers?.webhookId) {
    return headers;
  }

  const fallbackId = generateFallbackWebhookId(payload);
  const fallbackTimestamp = Math.floor(Date.now() / 1000).toString();

  console.warn(
    `[Webhook] Missing webhook-id header, using fallback. ` +
      `Event: ${payload.type}, Fallback ID: ${fallbackId}`
  );

  return {
    webhookId: fallbackId,
    webhookTimestamp: headers?.webhookTimestamp || fallbackTimestamp,
  };
}
