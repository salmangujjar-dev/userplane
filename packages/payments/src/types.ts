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
