/**
 * TTL constants for cache entries
 *
 * Values in seconds. Named by purpose and expected update frequency.
 */

export const TTL = {
  /**
   * Billing access status - checked on every resource creation
   * Short TTL (60s) because subscription state can change via webhooks
   */
  BILLING_ACCESS: 60,

  /**
   * Billing status summary - shown on billing page
   * Medium TTL (5 minutes) - less frequently accessed
   */
  BILLING_STATUS: 300,

  /**
   * Entitlement usage summary - shown on dashboard
   * Medium TTL (5 minutes) - updated on resource consumption
   */
  ENTITLEMENT_USAGE: 300,

  /**
   * Recording limit exceeded status - checked on link creation
   * Medium TTL (5 minutes) - updated on resource consumption
   */
  RECORDING_LIMITS: 300,

  /**
   * Open dispute status - hard safety latch
   * Short TTL (60s) because disputes override all access
   */
  DISPUTE_OPEN: 60,

  /**
   * Successful refund status - hard safety latch
   * Short TTL (60s) because refunds override all access
   */
  REFUND_SUCCESS: 60,

  /**
   * Link preferences - includes domain/workspace settings
   * Longer TTL (10 minutes) - preferences change infrequently
   */
  LINK_PREFERENCES: 600,
} as const;

export type TTLKey = keyof typeof TTL;
