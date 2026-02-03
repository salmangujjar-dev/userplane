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
   * Workspace recording preferences (branding, limits)
   * Longer TTL (10 minutes) - preferences change infrequently
   */
  WORKSPACE_RECORDING_PREFS: 600,

  /**
   * Domain recording preferences (capture settings)
   * Longer TTL (10 minutes) - preferences change infrequently
   */
  DOMAIN_RECORDING_PREFS: 600,

  /**
   * Link core data (link-specific properties only)
   * Longer TTL (10 minutes) - link data changes infrequently
   */
  LINK_CORE: 600,

  /**
   * Link to workspace mapping - lightweight lookup for cache-first pattern
   * Longer TTL (30 minutes) - linkId->workspaceId rarely changes
   */
  LINK_WORKSPACE_MAPPING: 1800,

  /**
   * Integration lookup - maps provider workspace to our workspace
   * Longer TTL (30 minutes) - integrations change very rarely
   */
  INTEGRATION_LOOKUP: 1800,

  /**
   * Intercom admins list - fetched from Intercom API
   * Medium TTL (5 minutes) - admin lists change infrequently
   */
  INTERCOM_ADMINS: 300,

  /**
   * Workspace membership - checked on every authenticated API request
   * Short TTL (2 minutes) - role changes should reflect quickly
   */
  MEMBERSHIP: 120,

  /**
   * Workspace existence - checked on every workspace API request
   * Short TTL (2 minutes) - deletion should reflect quickly
   */
  WORKSPACE_EXISTS: 120,
} as const;

export type TTLKey = keyof typeof TTL;
