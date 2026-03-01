/**
 * Billing schemas for API contracts
 */

import { SUBSCRIPTION_STATUSES } from '@userplane/payments/types';
import { BILLING_CADENCES, FEATURE_GATE_KEYS, PLAN_IDS } from '@userplane/pricing';
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
  currentPeriodEnd: z.coerce.date().nullable(),
  currentPeriodStart: z.coerce.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  cancelledAt: z.coerce.date().nullable(),
  onHoldSince: z.coerce.date().nullable(),
  trialEnd: z.coerce.date().nullable(),
  billingCadence: z.enum(BILLING_CADENCES).nullable(),
});

/**
 * Access status enum - subscription access state
 * - 'active': Full paid access to subscribed plan
 * - 'trial': Full paid access during trial period (no payment collected yet)
 * - 'grace': Temporary access (cancelled but in period, or payment failed in grace period)
 * - 'inactive': No paid access, falls back to free plan
 * - 'disputed': Payment dispute open - access blocked regardless of subscription status
 * - 'refunded': Payment refunded - access blocked regardless of subscription status
 */
export const AccessStatusSchema = z.enum([
  'active',
  'trial',
  'grace',
  'inactive',
  'disputed',
  'refunded',
]);

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
 * Note: UI can derive daysRemaining from contractDetail.onHoldSince or contractDetail.currentPeriodEnd
 */
export const AccessDetailSchema = z.object({
  effectivePlanId: EffectivePlanIdSchema,
  accessStatus: AccessStatusSchema,
});

/**
 * Feature gate schema - record of feature keys to boolean values
 */
export const FeatureGatesSchema = z.object(
  Object.fromEntries(FEATURE_GATE_KEYS.map((key) => [key, z.boolean()])) as {
    [K in (typeof FEATURE_GATE_KEYS)[number]]: z.ZodBoolean;
  }
);

/**
 * Subscription status response data
 *
 * Note: To check if a subscription exists, check if contractDetail.planId is not null
 * or if accessDetail.effectivePlanId is not 'free'
 */
export const SubscriptionStatusDataSchema = z.object({
  contractDetail: ContractDetailSchema,
  accessDetail: AccessDetailSchema,
  featureGates: FeatureGatesSchema,
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
    nextBillingDate: z.coerce.date(),
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
// Add-ons
// ============================================================================

export const SEATS_ADDON_PACK_SIZE = 5;
export const SEATS_ADDON_MAX_PACKS = 5;

/**
 * Add-on item
 */
export const AddonItemSchema = z.object({
  addonId: z.string(),
  quantity: z.number().int().min(0),
});

/**
 * Add-on item aliases for persistence boundaries
 */
export const AddonItemDbSchema = AddonItemSchema;
export const AddonItemsSchema = z.array(AddonItemSchema);
export const AddonItemsDbSchema = AddonItemsSchema.default([]);

/**
 * Add-ons status data
 */
export const AddonsStatusDataSchema = z.object({
  subscriptionId: z.string(),
  seatsQuantity: z.number().int().min(0),
  additionalSeats: z.number().int().min(0).multipleOf(SEATS_ADDON_PACK_SIZE),
  addons: AddonItemsSchema,
});

/**
 * Get add-ons status input
 */
export const GetAddonsStatusSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
});

/**
 * Get add-ons status response
 */
export const AddonsStatusResponseSchema = ApiResponseSchema(AddonsStatusDataSchema);

/**
 * Preview add-on change input
 */
export const PreviewAddonChangeSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    seatsQuantity: z.number().int().min(0).max(SEATS_ADDON_MAX_PACKS),
  }),
});

/**
 * Preview add-on change response
 */
export const PreviewAddonChangeResponseSchema = ApiResponseSchema(PlanChangePreviewDataSchema);

/**
 * Change add-on input
 */
export const ChangeAddonSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    seatsQuantity: z.number().int().min(0).max(SEATS_ADDON_MAX_PACKS),
  }),
});

/**
 * Change add-on response
 */
export const ChangeAddonResponseSchema = ApiResponseSchema(PlanChangeResultDataSchema);

// ============================================================================
// Unified Add-on Management
// ============================================================================

/**
 * Unified add-on management input
 * Handles preview and execute flows for seat add-ons
 */
export const ManageAddonsSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    seatsQuantity: z.number().int().min(0).max(SEATS_ADDON_MAX_PACKS),
    action: z.enum(['preview', 'execute']).optional(),
  }),
});

/**
 * Unified add-on management response data
 */
export const ManageAddonsDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('preview'),
    data: PlanChangePreviewDataSchema,
  }),
  z.object({
    type: z.literal('execute'),
    data: PlanChangeResultDataSchema,
  }),
]);

/**
 * Unified add-on management response
 */
export const ManageAddonsResponseSchema = ApiResponseSchema(ManageAddonsDataSchema);

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
  }),
});

// ============================================================================
// Unified Plan Management
// ============================================================================

/**
 * Unified plan management input
 * Handles checkout, preview, and execute flows
 * Members without billing permissions receive BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER error
 */
export const ManagePlanSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z
    .object({
      planId: z.enum(PLAN_IDS).optional(),
      productId: z.string().optional(),
      action: z.enum(['preview', 'execute']).optional(),
    })
    .refine((data) => data.planId || data.productId, {
      message: 'Either planId or productId must be provided',
    })
    .refine((data) => !(data.planId && data.productId), {
      message: 'Only one of planId or productId should be provided',
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
export type AddonItem = z.infer<typeof AddonItemSchema>;
export type AddonItems = z.infer<typeof AddonItemsSchema>;
export type AddonsStatusData = z.infer<typeof AddonsStatusDataSchema>;
export type ManagePlanData = z.infer<typeof ManagePlanDataSchema>; // Alias for internal service layer compatibility
export type ManageAddonsData = z.infer<typeof ManageAddonsDataSchema>;
export type SubscriptionAccessStatus = AccessDetail;
