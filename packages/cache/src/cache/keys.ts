/**
 * Cache key generation functions
 *
 * Convention: {service}:{entity}:{identifier}:{optional-qualifier}
 * All keys are prefixed consistently to avoid collisions.
 */

/**
 * Billing-related cache keys
 */
export const billingKeys = {
  /**
   * Subscription access status for a workspace
   * Used by: BillingService.getSubscriptionAccessStatus()
   */
  accessStatus: (workspaceId: string) => `billing:access:${workspaceId}`,

  /**
   * Full subscription status (contract + access details)
   * Used by: BillingService.getSubscriptionStatus()
   */
  subscriptionStatus: (workspaceId: string) => `billing:status:${workspaceId}`,
};

/**
 * Dispute-related cache keys
 */
export const disputeKeys = {
  /**
   * Whether workspace has an open dispute
   * Used by: BillingService.getSubscriptionAccessStatus()
   */
  hasOpen: (workspaceId: string) => `dispute:open:${workspaceId}`,
};

/**
 * Refund-related cache keys
 */
export const refundKeys = {
  /**
   * Whether workspace has a successful refund
   * Used by: BillingService.getSubscriptionAccessStatus()
   */
  hasSuccess: (workspaceId: string) => `refund:success:${workspaceId}`,
};

/**
 * Entitlement-related cache keys
 */
export const entitlementKeys = {
  /**
   * Usage summary for a workspace (all resources)
   * Used by: EntitlementService.getUsageSummary()
   */
  usageSummary: (workspaceId: string) => `entitlement:usage:${workspaceId}`,
};

/**
 * Link-related cache keys
 */
export const linkKeys = {
  /**
   * Link preferences including domain and workspace settings
   * Used by: SessionService for recording initialization
   */
  preferences: (linkId: string) => `link:prefs:${linkId}`,
};

/**
 * Pattern for invalidating all keys matching a workspace
 * Note: Upstash Redis doesn't support SCAN in REST API,
 * so we list specific keys to delete instead
 */
export function getWorkspaceBillingKeys(workspaceId: string): string[] {
  return [
    billingKeys.accessStatus(workspaceId),
    billingKeys.subscriptionStatus(workspaceId),
    disputeKeys.hasOpen(workspaceId),
    refundKeys.hasSuccess(workspaceId),
    entitlementKeys.usageSummary(workspaceId),
  ];
}
