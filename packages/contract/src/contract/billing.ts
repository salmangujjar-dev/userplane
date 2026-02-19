/**
 * Billing contract
 * Endpoints for subscription management and billing operations
 * All endpoints require cookie-based authentication
 */

import { oc } from '@orpc/contract';

import {
  AddonsStatusResponseSchema,
  BillingErrors,
  CustomerPortalResponseSchema,
  GetAddonsStatusSchema,
  GetCustomerPortalSchema,
  GetSubscriptionStatusSchema,
  GetUsageSummarySchema,
  ManageAddonsResponseSchema,
  ManageAddonsSchema,
  ManagePlanResponseSchema,
  ManagePlanSchema,
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
   * GET /billing/:workspaceId/addons
   * Get current add-ons status for a workspace
   * Requires workspace membership
   */
  getAddons: oc
    .route({
      method: 'GET',
      path: '/billing/{workspaceId}/addons',
      inputStructure: 'detailed',
      summary: 'Get add-ons status',
      description: 'Get current subscription add-ons for a workspace',
    })
    .input(GetAddonsStatusSchema)
    .output(AddonsStatusResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/addons
   * Manage seat add-ons for active subscription
   * - action=preview: Returns proration preview
   * - action=execute: Executes add-on change
   */
  manageAddons: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/addons',
      inputStructure: 'detailed',
      summary: 'Manage subscription add-ons',
      description: 'Preview or execute seat add-on changes for active subscription',
    })
    .input(ManageAddonsSchema)
    .output(ManageAddonsResponseSchema)
    .errors(BillingErrors),

  /**
   * POST /billing/:workspaceId/plan
   * Unified endpoint for plan management
   * Behavior depends on subscription status and user role:
   * - No subscription + owner/admin: Returns checkout URL
   * - Active subscription + owner/admin + no action: Returns preview
   * - Active subscription + owner/admin + action=execute: Executes plan change
   * - Active subscription + member: Creates request and sends email to owners
   * Requires workspace membership
   */
  managePlan: oc
    .route({
      method: 'POST',
      path: '/billing/{workspaceId}/plan',
      inputStructure: 'detailed',
      summary: 'Manage workspace plan',
      description: 'Unified endpoint for checkout, preview, execute, or request plan changes',
    })
    .input(ManagePlanSchema)
    .output(ManagePlanResponseSchema)
    .errors(BillingErrors),
});

export type BillingContract = typeof billingContract;
