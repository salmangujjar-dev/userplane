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
 * Access status enum - subscription access state
 */
export const AccessStatusSchema = z.enum(['active', 'grace', 'inactive', 'disputed', 'refunded']);

/**
 * Effective plan ID - union of paid plan IDs or 'free'
 */
export const EffectivePlanIdSchema = z.union([z.enum(PLAN_IDS), z.literal('free')]);

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
  effectivePlanId: EffectivePlanIdSchema,
  accessStatus: AccessStatusSchema,
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
// Plan Change Preview
// ============================================================================

/**
 * Preview plan change input
 */
export const PreviewPlanChangeSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planId: z.enum(PLAN_IDS),
  }),
});

/**
 * Line item for proration breakdown
 */
export const LineItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  unitPrice: z.number(),
  quantity: z.number(),
  tax: z.number().nullable(),
  taxRate: z.number().nullable(),
  prorationFactor: z.number().nullable(),
  type: z.string(),
});

/**
 * Charge summary details
 */
export const ChargeSummarySchema = z.object({
  currency: z.string(),
  totalAmount: z.number(),
  tax: z.number().nullable(),
  customerCredits: z.number(),
});

/**
 * Charge/credit amount details with line items
 */
export const ChargeAmountSchema = z.object({
  currency: z.string(),
  total: z.number(),
  summary: z.string(),
  lineItems: z.array(LineItemSchema),
  chargeSummary: ChargeSummarySchema,
});

/**
 * Credit amount details
 */
export const CreditAmountSchema = z.object({
  currency: z.string(),
  amount: z.number(),
  summary: z.string(),
});

/**
 * Plan change preview response data
 */
export const PlanChangePreviewDataSchema = z.object({
  immediateCharge: ChargeAmountSchema.nullable(),
  creditAmount: CreditAmountSchema.nullable(),
  newPlan: z.object({
    planId: z.string(),
    planName: z.string(),
    billingInterval: z.string(),
    nextBillingDate: z.string(),
    recurringPreTaxAmount: z.number(),
    paymentFrequencyInterval: z.string(),
  }),
  currentPlan: z.object({
    planId: z.string(),
    planName: z.string(),
  }),
  isUpgrade: z.boolean(),
});

/**
 * Plan change preview response
 */
export const PlanChangePreviewResponseSchema = ApiResponseSchema(PlanChangePreviewDataSchema);

// ============================================================================
// Plan Change
// ============================================================================

/**
 * Change plan input
 */
export const ChangePlanSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planId: z.enum(PLAN_IDS),
  }),
});

/**
 * Plan change result response data
 */
export const PlanChangeResultDataSchema = z.object({
  subscriptionId: z.string(),
  status: z.string(),
  newPlanId: z.string(),
  newPlanName: z.string(),
});

/**
 * Plan change result response
 */
export const PlanChangeResultResponseSchema = ApiResponseSchema(PlanChangeResultDataSchema);

// ============================================================================
// Upstream Payment Error Data
// ============================================================================

/**
 * Structured error data for upstream payment service errors
 * Used to provide actionable error details to the UI
 */
export const UpstreamPaymentErrorDataSchema = z.object({
  code: z.string(),
  message: z.string(),
});

// ============================================================================
// Plan Change Request (for non-admins)
// ============================================================================

/**
 * Request plan change input (for members who can't change plans directly)
 */
export const RequestPlanChangeSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planId: z.enum(PLAN_IDS),
    message: z.string().max(500).optional(),
  }),
});

/**
 * Plan change request response data
 */
export const PlanChangeRequestDataSchema = z.object({
  requestId: z.string(),
  status: z.literal('submitted'),
  planId: z.string(),
  planName: z.string(),
});

/**
 * Plan change request response
 */
export const PlanChangeRequestResponseSchema = ApiResponseSchema(PlanChangeRequestDataSchema);

// ============================================================================
// Unified Plan Management
// ============================================================================

/**
 * Unified plan management input
 * Handles checkout, preview, execute, and request flows
 */
export const ManagePlanSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    planId: z.enum(PLAN_IDS),
    action: z.enum(['preview', 'execute']).optional(),
    message: z.string().max(500).optional(),
  }),
});

/**
 * Unified plan management response data (discriminated union)
 */
export const ManagePlanDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('checkout'),
    data: CheckoutSessionDataSchema,
  }),
  z.object({
    type: z.literal('preview'),
    data: PlanChangePreviewDataSchema,
  }),
  z.object({
    type: z.literal('execute'),
    data: PlanChangeResultDataSchema,
  }),
  z.object({
    type: z.literal('request'),
    data: PlanChangeRequestDataSchema,
  }),
]);

/**
 * Unified plan management response
 */
export const ManagePlanResponseSchema = ApiResponseSchema(ManagePlanDataSchema);

// ============================================================================
// Type exports
// ============================================================================

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type ContractDetail = z.infer<typeof ContractDetailSchema>;
export type AccessStatus = z.infer<typeof AccessStatusSchema>;
export type EffectivePlanId = z.infer<typeof EffectivePlanIdSchema>;
export type AccessDetail = z.infer<typeof AccessDetailSchema>;
export type SubscriptionStatusData = z.infer<typeof SubscriptionStatusDataSchema>;
export type CheckoutSessionData = z.infer<typeof CheckoutSessionDataSchema>;
export type CustomerPortalData = z.infer<typeof CustomerPortalDataSchema>;
export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;
export type UsageSummaryData = z.infer<typeof UsageSummaryDataSchema>;
export type PlanChangePreviewData = z.infer<typeof PlanChangePreviewDataSchema>;
export type PlanChangeResultData = z.infer<typeof PlanChangeResultDataSchema>;
export type UpstreamPaymentErrorData = z.infer<typeof UpstreamPaymentErrorDataSchema>;
export type PlanChangeRequestData = z.infer<typeof PlanChangeRequestDataSchema>;
export type ManagePlanData = z.infer<typeof ManagePlanDataSchema>; // Alias for internal service layer compatibility
export type SubscriptionAccessStatus = AccessDetail;
