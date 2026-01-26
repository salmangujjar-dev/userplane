/**
 * Billing contract
 * Endpoints for subscription management and billing operations
 * All endpoints require cookie-based authentication
 */

import { oc } from '@orpc/contract';

import {
  BillingErrors,
  ChangePlanSchema,
  CheckoutSessionResponseSchema,
  CreateCheckoutSessionSchema,
  CustomerPortalResponseSchema,
  GetCustomerPortalSchema,
  GetSubscriptionStatusSchema,
  GetUsageSummarySchema,
  PlanChangePreviewResponseSchema,
  PlanChangeRequestResponseSchema,
  PlanChangeResultResponseSchema,
  PreviewPlanChangeSchema,
  RequestPlanChangeSchema,
  SubscriptionStatusResponseSchema,
  UsageSummaryResponseSchema,
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
   * Validate permissions and return product slug for checkout
   * Client then uses Better Auth DodoPayments plugin to create the actual checkout session
   * Requires authentication and workspace admin/owner role
   */
  createCheckout: oc
    .route({
      method: 'POST',
      path: '/billing/checkout',
      summary: 'Get checkout slug',
      description: 'Validates permissions and returns product slug for DodoPayments checkout',
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

  /**
   * GET /billing/:workspaceId/usage
   * Get entitlement usage summary for a workspace
   * Requires workspace membership
   */
  getUsage: oc
    .route({
      method: 'GET',
      path: '/billing/{workspaceId}/usage',
      inputStructure: 'detailed',
      summary: 'Get usage summary',
      description: 'Get entitlement usage summary for a workspace',
    })
    .input(GetUsageSummarySchema)
    .output(UsageSummaryResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/preview-plan-change
   * Preview proration details before changing subscription plan
   * Requires workspace admin/owner role
   */
  previewPlanChange: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/preview-plan-change',
      inputStructure: 'detailed',
      summary: 'Preview plan change',
      description: 'Preview proration details for upgrading or downgrading subscription plan',
    })
    .input(PreviewPlanChangeSchema)
    .output(PlanChangePreviewResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/change-plan
   * Execute subscription plan change
   * Requires workspace admin/owner role
   */
  changePlan: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/change-plan',
      inputStructure: 'detailed',
      summary: 'Change subscription plan',
      description: 'Change the subscription plan (upgrade or downgrade)',
    })
    .input(ChangePlanSchema)
    .output(PlanChangeResultResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/request-plan-change
   * Request a plan change (for non-admins)
   * Sends email notification to workspace owner
   * Requires workspace membership
   */
  requestPlanChange: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/request-plan-change',
      inputStructure: 'detailed',
      summary: 'Request plan change',
      description: 'Request a plan change - sends notification to workspace owner',
    })
    .input(RequestPlanChangeSchema)
    .output(PlanChangeRequestResponseSchema)
    .errors(BillingErrors),
});

export type BillingContract = typeof billingContract;
