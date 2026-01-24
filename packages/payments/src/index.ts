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

// State Machine
export type { TransitionValidationResult } from './state-machine';
export {
  isCancelledToExpiredValid,
  isTerminalState,
  isValidTransition,
  TERMINAL_STATES,
  VALID_TRANSITIONS,
  validateTransition,
} from './state-machine';

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
  SubscriptionPreviewChangePlanResponse,
  SubscriptionRecord,
  SubscriptionStatus,
  UpdateSubscriptionInput,
  WebhookEventType,
  WebhookPayload,
} from './types';
export { PRORATION_BILLING_MODES, SUBSCRIPTION_STATUSES } from './types'; // Error classes for type-safe error handling
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
} from './types';
