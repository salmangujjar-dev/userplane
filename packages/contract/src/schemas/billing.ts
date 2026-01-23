/**
 * Billing schemas for API contracts
 */

import type { SubscriptionPreviewChangePlanResponse } from '@workspace/payments';
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
 * Subscription status response data
 */
export const SubscriptionStatusDataSchema = z.object({
  hasSubscription: z.boolean(),
  status: SubscriptionStatusSchema.nullable(),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
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
// Change Plan
// ============================================================================

/**
 * Change subscription plan input
 * Note: Proration mode is controlled server-side as a business decision
 */
export const ChangePlanSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planSlug: z.string(),
  }),
});

/**
 * Change plan response data
 */
export const ChangePlanDataSchema = z.object({
  success: z.boolean(),
  previousPlanId: z.string().nullable(),
  newPlanId: z.string(),
  alreadyOnPlan: z.boolean().optional(),
});

/**
 * Change plan response
 */
export const ChangePlanResponseSchema = ApiResponseSchema(ChangePlanDataSchema);

// ============================================================================
// Preview Plan Change
// ============================================================================

/**
 * Preview plan change input
 */
export const PreviewPlanChangeSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planSlug: z.string(),
  }),
});

/**
 * Preview plan change response data
 * The preview field contains the official SubscriptionPreviewChangePlanResponse from DodoPayments
 * We use z.any() here as the type is complex and validated by TypeScript at compile time
 */
export const PreviewPlanChangeDataSchema: z.ZodType<{
  alreadyOnPlan: boolean;
  currentProductId?: string;
  newProductId?: string;
  preview?: SubscriptionPreviewChangePlanResponse;
}> = z.object({
  alreadyOnPlan: z.boolean(),
  currentProductId: z.string().optional(),
  newProductId: z.string().optional(),
  preview: z.any().optional(),
});

/**
 * Preview plan change response
 */
export const PreviewPlanChangeResponseSchema = ApiResponseSchema(PreviewPlanChangeDataSchema);

// ============================================================================
// Type exports
// ============================================================================

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionStatusData = z.infer<typeof SubscriptionStatusDataSchema>;
export type CheckoutSessionData = z.infer<typeof CheckoutSessionDataSchema>;
export type CustomerPortalData = z.infer<typeof CustomerPortalDataSchema>;
export type ChangePlanData = z.infer<typeof ChangePlanDataSchema>;
export type PreviewPlanChangeData = z.infer<typeof PreviewPlanChangeDataSchema>;
