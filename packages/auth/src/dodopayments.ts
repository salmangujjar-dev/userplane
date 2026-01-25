/**
 * DodoPayments Better Auth plugin configuration
 *
 * This module provides the DodoPayments integration for Better Auth.
 * Import from '@workspace/auth/dodopayments' to use.
 */

import { checkout, dodopayments, portal, usage, webhooks } from '@dodopayments/better-auth';
import type { ProductConfig } from '@workspace/payments/types';
import type DodoPayments from 'dodopayments';

/**
 * Webhook headers from DodoPayments
 */
export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
}

/**
 * Optional function to retrieve webhook context (headers) from AsyncLocalStorage.
 * This bridges the gap between the request interceptor and the onPayload callback,
 * since the Better Auth adapter doesn't expose headers to onPayload.
 */
let getWebhookContextFn: (() => WebhookHeaders | undefined) | null = null;

/**
 * Set the function to retrieve webhook context from AsyncLocalStorage.
 * Call this during app initialization with getWebhookContext from webhook-context.ts
 */
export function setWebhookContextProvider(fn: () => WebhookHeaders | undefined): void {
  getWebhookContextFn = fn;
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
              // Get webhook headers from AsyncLocalStorage context.
              // The headers (webhook-id, webhook-timestamp) are intercepted at the
              // request level and stored in AsyncLocalStorage before Better Auth processes
              // the request. This is necessary because the Better Auth adapter doesn't
              // expose headers to the onPayload callback.
              //
              // The webhook-id header is the canonical event ID from Dodo Payments
              // and should be used for idempotency checks.
              const headers = getWebhookContextFn?.();

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
