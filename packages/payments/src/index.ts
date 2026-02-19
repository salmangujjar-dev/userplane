/**
 * @workspace/payments - DodoPayments integration for Userplane
 *
 * This package provides:
 * - DodoPayments client configuration (server-only)
 * - Webhook handling utilities (server-only)
 * - Type definitions for billing
 *
 * CLIENT-SAFE EXPORTS:
 * - Types only (no runtime code with process.env)
 *
 * SERVER-ONLY IMPORTS:
 * - '@workspace/payments/products' - Product configuration (uses process.env)
 * - '@workspace/payments/client' - DodoPayments client
 * - '@workspace/payments/webhooks' - Webhook handlers
 */

// Client (server-only but safe to import for types)
export {
  createDodoPaymentsClient,
  DodoPayments,
  getDodoPaymentsClient,
  resetDodoPaymentsClient,
} from './client';

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

// Add-ons
export type { BillingInterval } from './addons';
export {
  DODO_ADDON_IDS,
  getBillingIntervalFromPlanId,
  getSeatsAddonIdForInterval,
  getSeatsAddonIdForPlanId,
  isSeatsAddonId,
} from './addons';

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
