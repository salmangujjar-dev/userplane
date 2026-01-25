/**
 * Billing schemas for API contracts
 */

import { SUBSCRIPTION_STATUSES } from '@workspace/payments';
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
 * Access status for entitlement checks
 */
export const AccessStatusSchema = z.object({
  hasAccess: z.boolean(),
  effectivePlanId: z.string(),
  reason: z.enum([
    'active',
    'cancelled_in_period',
    'on_hold_grace',
    'no_subscription',
    'expired',
    'revoked',
  ]),
  expiresAt: z.date().nullable().optional(),
  daysRemaining: z.number().optional(),
});

/**
 * Subscription status response data
 */
export const SubscriptionStatusDataSchema = z.object({
  hasSubscription: z.boolean(),
  status: SubscriptionStatusSchema.nullable(),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  currentPeriodEnd: z.date().nullable(),
  currentPeriodStart: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  cancelledAt: z.date().nullable(),
  onHoldSince: z.date().nullable(),
  accessStatus: AccessStatusSchema,
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
 */
export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    workspaceId: z.string(),
    planSlug: z.string(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

/**
 * Checkout session response data
 */
export const CheckoutSessionDataSchema = z.object({
  checkoutUrl: z.string(),
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
 */
export const ResourceUsageSchema = z.object({
  consumed: z.number(),
  credited: z.number(),
  available: z.number(),
  quotedLimit: z.number(),
  softLimit: z.number(),
  hardLimit: z.number(),
  isUnlimited: z.boolean(),
  percentUsed: z.number(),
  isOverSoftLimit: z.boolean(),
  isOverHardLimit: z.boolean(),
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
export type AccessStatus = z.infer<typeof AccessStatusSchema>;
export type SubscriptionStatusData = z.infer<typeof SubscriptionStatusDataSchema>;
export type CheckoutSessionData = z.infer<typeof CheckoutSessionDataSchema>;
export type CustomerPortalData = z.infer<typeof CustomerPortalDataSchema>;
export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;
export type UsageSummaryData = z.infer<typeof UsageSummaryDataSchema>;
