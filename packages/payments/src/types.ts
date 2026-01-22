/**
 * DodoPayments type definitions for Userplane billing
 */

import type { PlanId } from '@workspace/pricing';

/**
 * Subscription status from DodoPayments
 */
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'on_hold'
  | 'cancelled'
  | 'failed'
  | 'expired';

/**
 * Payment frequency interval
 */
export type PaymentInterval = 'Day' | 'Week' | 'Month' | 'Year';

/**
 * DodoPayments customer information
 */
export interface DodoCustomer {
  customer_id: string;
  email: string;
  name: string;
  phone_number?: string | null;
}

/**
 * DodoPayments subscription data from webhooks
 */
export interface DodoSubscription {
  subscription_id: string;
  customer: DodoCustomer;
  product_id: string;
  status: SubscriptionStatus;
  currency: string;
  recurring_pre_tax_amount: number;
  next_billing_date: string;
  previous_billing_date?: string;
  payment_frequency_interval: PaymentInterval;
  payment_frequency_count: number;
  subscription_period_interval: PaymentInterval;
  subscription_period_count: number;
  trial_period_days?: number;
  metadata?: Record<string, string>;
  cancelled_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

/**
 * Webhook event types for subscriptions
 */
export type SubscriptionWebhookEvent =
  | 'subscription.active'
  | 'subscription.updated'
  | 'subscription.on_hold'
  | 'subscription.renewed'
  | 'subscription.plan_changed'
  | 'subscription.cancelled'
  | 'subscription.failed'
  | 'subscription.expired';

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event_type: SubscriptionWebhookEvent;
  data: DodoSubscription;
  timestamp: string;
}

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
