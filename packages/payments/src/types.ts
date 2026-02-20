/**
 * DodoPayments type definitions for Userplane billing
 *
 * Re-exports official types from 'dodopayments' package and defines
 * Userplane-specific types for billing integration.
 */

import type { PlanId } from '@workspace/pricing';
import type DodoPayments from 'dodopayments';

// Re-export official DodoPayments types
export type DodoSubscription = DodoPayments.Subscription;
export type SubscriptionStatus = DodoPayments.SubscriptionStatus;
export type PaymentInterval = DodoPayments.TimeInterval;
export type DodoCustomer = DodoPayments.CustomerLimitedDetails;
export type WebhookPayload = DodoPayments.UnwrapWebhookEvent;
export type WebhookEventType = DodoPayments.WebhookEventType;
export type SubscriptionChangePlanParams = DodoPayments.SubscriptionChangePlanParams;
export type SubscriptionPreviewChangePlanResponse =
  DodoPayments.SubscriptionPreviewChangePlanResponse;
export type AttachAddon = DodoPayments.AttachAddon;
export type AddonCartResponseItem = DodoPayments.AddonCartResponseItem;

/**
 * Re-export DodoPayments error classes for type-safe error handling
 *
 * Use these error classes with instanceof checks instead of parsing status codes:
 *
 * @example
 * ```typescript
 * import { ConflictError } from '@workspace/payments';
 *
 * try {
 *   await dodoClient.subscriptions.changePlan(subscriptionId, params);
 * } catch (error) {
 *   if (error instanceof ConflictError) {
 *     // Handle 409 Conflict (e.g., pending payment)
 *   }
 * }
 * ```
 *
 * Available error classes:
 * - ConflictError (409): Subscription on hold, pending payment
 * - NotFoundError (404): Resource not found
 * - BadRequestError (400): Invalid request
 * - UnprocessableEntityError (422): Validation failed
 * - AuthenticationError (401): Invalid credentials
 * - PermissionDeniedError (403): Insufficient permissions
 * - RateLimitError (429): Too many requests
 * - InternalServerError (500): Server error
 */
export {
  APIError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  DodoPaymentsError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from 'dodopayments';

/**
 * Proration billing mode type from DodoPayments
 * Extracted from SubscriptionChangePlanParams
 */
export type ProrationBillingMode =
  DodoPayments.SubscriptionChangePlanParams['proration_billing_mode'];

/**
 * On payment failure behavior type from DodoPayments
 * Extracted from SubscriptionChangePlanParams
 */
export type OnPaymentFailure = DodoPayments.SubscriptionChangePlanParams['on_payment_failure'];

/**
 * Subscription status values as a readonly array
 * Derived from the official DodoPayments.SubscriptionStatus type
 * Use this array to create database enums and validation schemas
 */
export const SUBSCRIPTION_STATUSES = [
  'pending',
  'active',
  'on_hold',
  'cancelled',
  'failed',
  'expired',
] as const satisfies readonly SubscriptionStatus[];

/**
 * Proration billing mode values as a readonly array
 * Derived from the official DodoPayments.SubscriptionChangePlanParams type
 * Use this array to create validation schemas
 */
export const PRORATION_BILLING_MODES = [
  'prorated_immediately',
  'full_immediately',
  'difference_immediately',
] as const satisfies readonly ProrationBillingMode[];

/**
 * On payment failure behavior values as a readonly array
 * Derived from the official DodoPayments.SubscriptionChangePlanParams type
 * Use this array to create validation schemas
 */
export const ON_PAYMENT_FAILURE_MODES = [
  'prevent_change',
  'apply_change',
] as const satisfies readonly NonNullable<OnPaymentFailure>[];

/**
 * Configuration for DodoPayments client
 */
export interface DodoPaymentsConfig {
  apiKey: string;
  webhookSecret: string;
  webhookKey?: string;
  environment: 'test_mode' | 'live_mode';
}

/**
 * Product configuration for checkout
 * Maps Userplane plan IDs to DodoPayments product IDs
 */
export interface ProductConfig {
  productId: string;
  slug: string;
  planId: PlanId;
}

/**
 * Checkout session configuration
 */
export interface CheckoutConfig {
  products: ProductConfig[];
  successUrl: string;
  cancelUrl?: string;
  authenticatedUsersOnly?: boolean;
}

/**
 * Subscription record for database storage
 */
export interface SubscriptionRecord {
  id: string;
  workspaceId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create subscription input
 */
export interface CreateSubscriptionInput {
  workspaceId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

/**
 * Update subscription input
 */
export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus;
  planId?: PlanId;
  productId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelledAt?: Date | null;
}

// ============================================================================
// Dispute Types
// ============================================================================

// Re-export official DodoPayments dispute types
export type DodoDispute = DodoPayments.Dispute;
export type DodoDisputeStatus = DodoPayments.DisputeStatus;
export type DodoDisputeStage = DodoPayments.DisputeStage;

/**
 * Dispute webhook event types
 * Maps Dodo's DisputeStatus values to webhook event names
 */
export const DISPUTE_EVENT_TYPES = [
  'dispute.opened',
  'dispute.expired',
  'dispute.accepted',
  'dispute.cancelled',
  'dispute.challenged',
  'dispute.won',
  'dispute.lost',
] as const;

export type DisputeEventType = (typeof DISPUTE_EVENT_TYPES)[number];

/**
 * Helper to check if dispute event resolves (closes) the dispute
 * Resolution events: won, lost, accepted, cancelled, expired
 */
export function isDisputeResolutionEvent(eventType: DisputeEventType): boolean {
  return [
    'dispute.won',
    'dispute.lost',
    'dispute.accepted',
    'dispute.cancelled',
    'dispute.expired',
  ].includes(eventType);
}

// ============================================================================
// Refund Types
// ============================================================================

// Re-export official DodoPayments refund types
export type DodoRefund = DodoPayments.Refund;
export type DodoRefundStatus = DodoPayments.RefundStatus;

/**
 * Refund webhook event types
 */
export const REFUND_EVENT_TYPES = ['refund.succeeded', 'refund.failed'] as const;

export type RefundEventType = (typeof REFUND_EVENT_TYPES)[number];

// Re-export metadata types and functions
export type { DodoFeatureLimits, ProductPlanMetadata } from './metadata';
export {
  BILLING_CADENCE_METADATA_KEY,
  buildFlatMetadata,
  fetchProductMetadata,
  GATE_METADATA_KEYS,
  LIMIT_METADATA_KEYS,
  parseFlatMetadata,
} from './metadata';
