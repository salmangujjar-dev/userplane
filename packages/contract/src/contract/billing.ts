/**
 * Billing contract
 * Endpoints for subscription management and billing operations
 * All endpoints require cookie-based authentication
 */

import { oc } from '@orpc/contract';

import {
  BillingErrors,
  ChangePlanResponseSchema,
  ChangePlanSchema,
  CheckoutSessionResponseSchema,
  CreateCheckoutSessionSchema,
  CustomerPortalResponseSchema,
  GetCustomerPortalSchema,
  GetSubscriptionStatusSchema,
  PreviewPlanChangeResponseSchema,
  PreviewPlanChangeSchema,
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
      summary: 'Get customer portal URL',
      description: 'Get the DodoPayments customer portal URL for a workspace',
    })
    .input(GetCustomerPortalSchema)
    .output(CustomerPortalResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/preview-plan-change
   * Preview the cost of changing subscription plan
   * Shows proration details before committing the change
   * Requires workspace admin role
   */
  previewPlanChange: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/preview-plan-change',
      summary: 'Preview subscription plan change',
      description: 'Preview proration and cost details for a plan change without committing',
    })
    .input(PreviewPlanChangeSchema)
    .output(PreviewPlanChangeResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/change-plan
   * Change the subscription plan for a workspace
   * For upgrading/downgrading existing subscriptions
   * Requires workspace admin role
   */
  changePlan: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/change-plan',
      summary: 'Change subscription plan',
      description: 'Upgrade or downgrade an existing subscription to a different plan',
    })
    .input(ChangePlanSchema)
    .output(ChangePlanResponseSchema)
    .errors(BillingErrors),
});

export type BillingContract = typeof billingContract;
