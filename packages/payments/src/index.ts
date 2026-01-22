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
export type { WebhookHandlers } from './webhooks';
export {
  extractWorkspaceIdFromMetadata,
  isSubscriptionEvent,
  mapSubscriptionStatus,
  parseSubscriptionDates,
  processWebhookPayload,
  SUBSCRIPTION_EVENTS,
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
  SubscriptionRecord,
  SubscriptionStatus,
  SubscriptionWebhookEvent,
  UpdateSubscriptionInput,
  WebhookPayload,
} from './types';
