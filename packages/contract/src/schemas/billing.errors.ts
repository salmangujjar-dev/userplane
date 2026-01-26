/**
 * Billing error definitions
 *
 * Error factory is created in utils/errors.ts
 * Import billingError from '@workspace/contract' to use
 */

export const BillingErrors = {
  SUBSCRIPTION_NOT_FOUND: {
    message: 'Subscription not found',
    status: 404,
  },
  SUBSCRIPTION_ALREADY_EXISTS: {
    message: 'Workspace already has an active subscription',
    status: 409,
  },
  INVALID_PLAN: {
    message: 'Invalid plan selected',
    status: 400,
  },
  CHECKOUT_FAILED: {
    message: 'Failed to create checkout session',
    status: 500,
  },
  PORTAL_UNAVAILABLE: {
    message: 'Customer portal is not available for this workspace',
    status: 400,
  },
  WEBHOOK_VERIFICATION_FAILED: {
    message: 'Webhook signature verification failed',
    status: 401,
  },
  NO_CUSTOMER_ID: {
    message: 'Workspace does not have a billing customer ID',
    status: 400,
  },
  PLAN_CHANGE_NOT_ALLOWED: {
    message: 'Plan change is not allowed for this subscription',
    status: 400,
  },
  SUBSCRIPTION_ON_HOLD: {
    message: 'Cannot change plan while subscription is on hold',
    status: 409,
  },
  SAME_PLAN_SELECTED: {
    message: 'You are already on this plan',
    status: 400,
  },
  PLAN_CHANGE_FAILED: {
    message: 'Failed to change subscription plan',
    status: 500,
  },
  PREVIEW_FAILED: {
    message: 'Failed to preview plan change',
    status: 500,
  },
  PREVIOUS_PAYMENT_PENDING: {
    message: 'Cannot change plan while a previous payment is still processing',
    status: 409,
  },
  PAYMENT_METHOD_INVALID: {
    message: 'Payment method is invalid or expired. Please update your payment method.',
    status: 402,
  },
  PRODUCT_NOT_AVAILABLE: {
    message: 'The selected plan is not available',
    status: 422,
  },
  /**
   * Upstream payment service error with structured data
   * UI should use data.code and data.message for display
   */
  UPSTREAM_PAYMENT_ERROR: {
    message: 'Payment service error',
    status: 502,
  },
  PLAN_CHANGE_REQUEST_FAILED: {
    message: 'Failed to submit plan change request',
    status: 500,
  },
} as const;
