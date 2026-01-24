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
} as const;
