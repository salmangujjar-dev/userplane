/**
 * DodoPayments Better Auth plugin configuration
 *
 * This module provides the DodoPayments integration for Better Auth.
 * Import from '@workspace/auth/dodopayments' to use.
 */

import { checkout, dodopayments, portal, usage, webhooks } from '@dodopayments/better-auth';
import type { ProductConfig } from '@workspace/payments';
import type DodoPayments from 'dodopayments';

/**
 * Webhook headers from DodoPayments
 */
export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
}

/**
 * Configuration for DodoPayments Better Auth plugin
 */
export interface DodoPaymentsAuthConfig {
  /** DodoPayments SDK client instance */
  client: DodoPayments;
  /** Create customer in DodoPayments when user signs up */
  createCustomerOnSignUp?: boolean;
  /** Product configurations for checkout */
  products: ProductConfig[];
  /** URL to redirect after successful checkout */
  successUrl: string;
  /** Webhook secret for signature verification */
  webhookSecret: string;
  /** Only allow authenticated users to create checkout sessions */
  authenticatedUsersOnly?: boolean;
  /** Callback for webhook payloads (with optional headers for idempotency) */
  onWebhookPayload?: (payload: unknown, headers?: WebhookHeaders) => Promise<void>;
}

/**
 * Create the DodoPayments plugin configuration for Better Auth
 */
export function createDodoPaymentsPlugin(config: DodoPaymentsAuthConfig) {
  const {
    client,
    createCustomerOnSignUp = true,
    products,
    successUrl,
    webhookSecret,
    authenticatedUsersOnly = true,
    onWebhookPayload,
  } = config;

  // Map products to checkout configuration format
  const checkoutProducts = products.map((p) => ({
    productId: p.productId,
    slug: p.slug,
  }));

  return dodopayments({
    client,
    createCustomerOnSignUp,
    use: [
      checkout({
        products: checkoutProducts,
        authenticatedUsersOnly,
        successUrl,
      }),
      portal(),
      webhooks({
        webhookKey: webhookSecret,
        onPayload: onWebhookPayload
          ? async (payload) => {
              // Note: DodoPayments sends webhook-id and webhook-timestamp headers,
              // but the @dodopayments/better-auth plugin doesn't expose them to this callback.
              // It uses them internally for signature verification.
              //
              // We generate a deterministic webhook ID from the payload fields:
              // - business_id: identifies the merchant
              // - timestamp: when the event occurred (matches webhook-timestamp header)
              // - type: the event type
              //
              // This combination is unique per webhook event and provides idempotency.
              let headers: WebhookHeaders | undefined;
              try {
                const webhookPayload = payload as {
                  business_id?: string;
                  timestamp?: Date | string;
                  type?: string;
                };

                if (webhookPayload.business_id && webhookPayload.timestamp) {
                  const timestamp =
                    typeof webhookPayload.timestamp === 'string'
                      ? webhookPayload.timestamp
                      : webhookPayload.timestamp.toISOString();

                  // Create deterministic webhook ID from payload fields
                  // Format: {business_id}-{ISO timestamp}-{event_type}
                  const webhookId = `${webhookPayload.business_id}-${timestamp}-${webhookPayload.type || 'unknown'}`;

                  headers = {
                    webhookId,
                    webhookTimestamp: timestamp,
                  };
                }
              } catch {
                // Payload parsing failed, continue without headers
              }

              await onWebhookPayload(payload, headers);
            }
          : undefined,
      }),
      usage(),
    ],
  });
}

// Re-export types and utilities from @dodopayments/better-auth
export { checkout, dodopayments, portal, usage, webhooks };
