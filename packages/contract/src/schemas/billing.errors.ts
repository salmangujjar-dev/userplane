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
  INVALID_PLAN: {
    message: 'Invalid plan selected',
    status: 400,
  },
  PORTAL_UNAVAILABLE: {
    message: 'Customer portal is not available for this workspace',
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
  /**
   * Upstream payment service error with structured data
   * UI should use data.code and data.message for display
   * Error codes may include: PREVIEW_FAILED, PLAN_CHANGE_FAILED, etc.
   */
  UPSTREAM_PAYMENT_ERROR: {
    message: 'Payment service error',
    status: 502,
  },
  PLAN_CHANGE_REQUEST_FAILED: {
    message: 'Failed to submit plan change request',
    status: 500,
  },
  PLAN_LIMIT_EXCEEDED: {
    status: 403,
    message: 'You have reached your plan limit. Upgrade for more.',
  },
} as const;
