/**
 * @workspace/payments - DodoPayments integration for Userplane
 *
 * This package provides:
 * - DodoPayments client configuration
 * - Product/plan mappings
 * - Webhook handling utilities
 * - Type definitions for billing
 */

// Client
export {
  createDodoPaymentsClient,
  DodoPayments,
  getDodoPaymentsClient,
  resetDodoPaymentsClient,
} from './client';

// Products
export {
  CHECKOUT_PRODUCTS,
  DODO_PRODUCT_IDS,
  getPlanIdFromProductId,
  getProductByPlanId,
  getProductByProductId,
  getProductBySlug,
  getSlugFromPlanId,
} from './products';

// Webhooks
export type { SubscriptionWebhookPayload, WebhookHandlers } from './webhooks';
export {
  extractWorkspaceIdFromMetadata,
  isSubscriptionEvent,
  isSubscriptionWebhook,
  mapSubscriptionStatus,
  parseSubscriptionDates,
  processWebhookPayload,
} from './webhooks';

// Types
export type {
  CheckoutConfig,
  CreateSubscriptionInput,
  DodoCustomer,
  DodoPaymentsConfig,
  DodoSubscription,
  PaymentInterval,
  ProductConfig,
  ProrationBillingMode,
  SubscriptionChangePlanParams,
  SubscriptionRecord,
  SubscriptionStatus,
  UpdateSubscriptionInput,
  WebhookEventType,
  WebhookPayload,
} from './types';
export { PRORATION_BILLING_MODES, SUBSCRIPTION_STATUSES } from './types';
