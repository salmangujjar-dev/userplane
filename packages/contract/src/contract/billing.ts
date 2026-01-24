/**
 * Billing contract
 * Endpoints for subscription management and billing operations
 * All endpoints require cookie-based authentication
 */

import { oc } from '@orpc/contract';

import {
  BillingErrors,
  CheckoutSessionResponseSchema,
  CreateCheckoutSessionSchema,
  CustomerPortalResponseSchema,
  GetCustomerPortalSchema,
  GetSubscriptionStatusSchema,
  SubscriptionStatusResponseSchema,
} from '../schemas';

/**
 * Billing contract definition
 */
export const billingContract = oc.router({
  /**
   * GET /billing/:workspaceId/status
   * Get subscription status for a workspace
   * Requires workspace membership
   */
  getStatus: oc
    .route({
      method: 'GET',
      path: '/billing/{workspaceId}/status',
      inputStructure: 'detailed',
      summary: 'Get subscription status',
      description: 'Get the current subscription status for a workspace',
    })
    .input(GetSubscriptionStatusSchema)
    .output(SubscriptionStatusResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/checkout
   * Create a checkout session for subscribing to a plan
   * Requires authentication
   */
  createCheckout: oc
    .route({
      method: 'POST',
      path: '/billing/checkout',
      summary: 'Create checkout session',
      description: 'Create a DodoPayments checkout session for a workspace',
    })
    .input(CreateCheckoutSessionSchema)
    .output(CheckoutSessionResponseSchema)
    .errors(BillingErrors),

  /**
   * GET /billing/:workspaceId/portal
   * Get customer portal URL for managing subscription
   * Requires workspace admin role
   */
  getPortal: oc
    .route({
      method: 'GET',
      path: '/billing/{workspaceId}/portal',
      inputStructure: 'detailed',
      summary: 'Get customer portal URL',
      description: 'Get the DodoPayments customer portal URL for a workspace',
    })
    .input(GetCustomerPortalSchema)
    .output(CustomerPortalResponseSchema)
    .errors(BillingErrors),
});

export type BillingContract = typeof billingContract;
