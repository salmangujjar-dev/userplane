/**
 * Billing schemas for API contracts
 */

import { SUBSCRIPTION_STATUSES } from '@workspace/payments/types';
import { PLAN_IDS } from '@workspace/pricing';
import { z } from 'zod';

import { ApiResponseSchema } from './common';

// ============================================================================
// Subscription Status
// ============================================================================

/**
 * Subscription status values from DodoPayments
 * Uses official subscription status values from the dodopayments package
 */
export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

/**
 * Contract detail - raw subscription contract information
 * Contains the subscription status and billing periods
 */
export const ContractDetailSchema = z.object({
  status: SubscriptionStatusSchema.nullable(),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  currentPeriodEnd: z.date().nullable(),
  currentPeriodStart: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  cancelledAt: z.date().nullable(),
  onHoldSince: z.date().nullable(),
});

/**
 * Access detail - computed access/entitlement information
 *
 * effectivePlanId:
 * - PlanId: User has access to this paid plan
 * - 'free': User has no paid access, falls back to free plan
 *
 * accessStatus:
 * - 'active': Full paid access to subscribed plan
 * - 'grace': Temporary access (cancelled but in period, or payment failed in grace period)
 * - 'inactive': No paid access, falls back to free plan
 * - 'disputed': Payment dispute open - access blocked regardless of subscription status
 * - 'refunded': Payment refunded - access blocked regardless of subscription status
 *
 * Note: UI can derive daysRemaining from contractDetail.onHoldSince or contractDetail.currentPeriodEnd
 */
export const AccessDetailSchema = z.object({
  effectivePlanId: z.string(),
  accessStatus: z.enum(['active', 'grace', 'inactive', 'disputed', 'refunded']),
});

/**
 * Subscription status response data
 *
 * Note: To check if a subscription exists, check if contractDetail.planId is not null
 * or if accessDetail.effectivePlanId is not 'free'
 */
export const SubscriptionStatusDataSchema = z.object({
  contractDetail: ContractDetailSchema,
  accessDetail: AccessDetailSchema,
});

/**
 * Get subscription status by workspace ID
 */
export const GetSubscriptionStatusSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Subscription status response
 */
export const SubscriptionStatusResponseSchema = ApiResponseSchema(SubscriptionStatusDataSchema);

// ============================================================================
// Checkout Session
// ============================================================================

/**
 * Create checkout session input
 * Accepts planId (type-safe enum of valid plan IDs)
 */
export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    workspaceId: z.string(),
    planId: z.enum(PLAN_IDS),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

/**
 * Checkout session response data
 * Returns the product slug for creating checkout with Better Auth
 */
export const CheckoutSessionDataSchema = z.object({
  checkoutUrl: z.string(),
  slug: z.string(),
  sessionId: z.string().optional(),
});

/**
 * Checkout session response
 */
export const CheckoutSessionResponseSchema = ApiResponseSchema(CheckoutSessionDataSchema);

// ============================================================================
// Customer Portal
// ============================================================================

/**
 * Get customer portal URL input
 */
export const GetCustomerPortalSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Customer portal response data
 */
export const CustomerPortalDataSchema = z.object({
  portalUrl: z.string(),
});

/**
 * Customer portal response
 */
export const CustomerPortalResponseSchema = ApiResponseSchema(CustomerPortalDataSchema);

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Resource usage data for a single resource type
 * User-facing API showing usage against plan limits
 * limit: -1 indicates unlimited
 */
export const ResourceUsageSchema = z.object({
  consumed: z.number(),
  limit: z.number(),
  percentUsed: z.number(),
});

/**
 * Usage summary data
 */
export const UsageSummaryDataSchema = z.object({
  planId: z.string(),
  planName: z.string(),
  resources: z.record(z.string(), ResourceUsageSchema),
});

/**
 * Get usage summary input
 */
export const GetUsageSummarySchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Usage summary response
 */
export const UsageSummaryResponseSchema = ApiResponseSchema(UsageSummaryDataSchema);

// ============================================================================
// Type exports
// ============================================================================

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type ContractDetail = z.infer<typeof ContractDetailSchema>;
export type AccessDetail = z.infer<typeof AccessDetailSchema>;
export type SubscriptionStatusData = z.infer<typeof SubscriptionStatusDataSchema>;
export type CheckoutSessionData = z.infer<typeof CheckoutSessionDataSchema>;
export type CustomerPortalData = z.infer<typeof CustomerPortalDataSchema>;
export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;
export type UsageSummaryData = z.infer<typeof UsageSummaryDataSchema>;
