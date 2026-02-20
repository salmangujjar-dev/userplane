/**
 * Billing-related constants
 */

/**
 * Default trial period in days for paid plan checkouts
 */
export const DEFAULT_TRIAL_PERIOD_DAYS = 7;

/**
 * Allowed trial period options (in days) for admin provisioning
 */
export const ADMIN_TRIAL_PERIOD_OPTIONS = [0, 7, 14, 28] as const;

/**
 * Trial period values as strings for schema validation
 */
export const ADMIN_TRIAL_PERIOD_VALUES = ['0', '7', '14', '28'] as const;
