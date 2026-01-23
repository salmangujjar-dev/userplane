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

/**
 * Proration billing mode type from DodoPayments
 * Extracted from SubscriptionChangePlanParams
 */
export type ProrationBillingMode =
  DodoPayments.SubscriptionChangePlanParams['proration_billing_mode'];

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
 * Configuration for DodoPayments client
 */
export interface DodoPaymentsConfig {
  apiKey: string;
  webhookSecret: string;
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
