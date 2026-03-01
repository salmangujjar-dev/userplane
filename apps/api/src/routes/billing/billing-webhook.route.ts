/**
 * Billing Webhook Route
 *
 * Direct webhook endpoint for DodoPayments.
 * Verifies webhook signature using the SDK and routes to the billing webhook handler.
 */

import type { DodoPayments } from '@userplane/payments/client';
import type { WebhookPayload } from '@userplane/payments/types';
import type { Context } from 'hono';

import type { WebhookHeaders } from '@/api/handlers/billing-webhook.handler';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('billing-webhook-route');

interface BillingWebhookRouteDeps {
  dodoClient: DodoPayments;
  handleBillingWebhook: (payload: WebhookPayload, headers: WebhookHeaders) => Promise<void>;
}

/**
 * Create the billing webhook Hono route handler
 */
export function createBillingWebhookRoute(deps: BillingWebhookRouteDeps) {
  const { dodoClient, handleBillingWebhook } = deps;

  return async (c: Context) => {
    try {
      const body = await c.req.text();
      const webhookId = c.req.header('webhook-id') ?? '';
      const webhookTimestamp = c.req.header('webhook-timestamp') ?? '';
      const webhookSignature = c.req.header('webhook-signature') ?? '';
      const contentType = c.req.header('content-type') ?? '';

      // Verify signature and parse payload using SDK
      const headers: Record<string, string> = {
        ...(webhookId && { 'webhook-id': webhookId }),
        ...(webhookTimestamp && { 'webhook-timestamp': webhookTimestamp }),
        ...(webhookSignature && { 'webhook-signature': webhookSignature }),
        ...(contentType && { 'content-type': contentType }),
      };
      const payload = dodoClient.webhooks.unwrap(body, { headers });

      await handleBillingWebhook(payload, { webhookId, webhookTimestamp });

      return c.json({ received: true });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'WebhookVerificationError' ||
          error.message.includes('signature') ||
          error.message.includes('Webhook key must not be null'))
      ) {
        logger.warn({ err: error }, 'Webhook signature verification failed');
        return c.json({ error: 'Invalid webhook signature' }, 400);
      }

      logger.error({ err: error }, 'Webhook processing error');
      captureException(error);
      return c.json({ error: 'Webhook processing failed' }, 500);
    }
  };
}
