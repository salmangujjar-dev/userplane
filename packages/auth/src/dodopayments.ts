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
  /** Callback for webhook payloads */
  onWebhookPayload?: (payload: unknown) => Promise<void>;
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
              await onWebhookPayload(payload);
            }
          : undefined,
      }),
      usage(),
    ],
  });
}

// Re-export types and utilities from @dodopayments/better-auth
export { checkout, dodopayments, portal, usage, webhooks };
