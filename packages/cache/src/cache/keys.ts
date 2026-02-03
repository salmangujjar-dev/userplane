/**
 * Cache key generation functions
 *
 * Convention: {service}:{entity}:{identifier}:{optional-qualifier}
 * All keys are prefixed consistently to avoid collisions.
 *
 * Type safety: Each key type is branded to prevent mixing keys with wrong value types.
 */

import type { CacheType } from '@workspace/contract';

// ============================================================
// Branded key types - ensures type safety between keys and values
// ============================================================

/** Branded type for cache keys - prevents mixing key types */
type CacheKey<T extends string> = string & { readonly __brand: T };

export type BillingAccessKey = CacheKey<'billing:access'>;
export type BillingStatusKey = CacheKey<'billing:status'>;
export type DisputeOpenKey = CacheKey<'dispute:open'>;
export type RefundSuccessKey = CacheKey<'refund:success'>;
export type EntitlementUsageKey = CacheKey<'entitlement:usage'>;
export type LinkCoreKey = CacheKey<'link:core'>;
export type LinkWorkspaceMappingKey = CacheKey<'link:ws'>;
export type WorkspaceRecordingPrefsKey = CacheKey<'workspace:recording-prefs'>;
export type DomainRecordingPrefsKey = CacheKey<'domain:recording-prefs'>;
export type IntegrationKey = CacheKey<'integration'>;
export type IntercomAdminsKey = CacheKey<'intercom:admins'>;
export type MembershipKey = CacheKey<'member'>;
export type WorkspaceExistsKey = CacheKey<'workspace:exists'>;

// ============================================================
// Key generators
// ============================================================

export const billingKeys = {
  /** Subscription access status for a workspace */
  accessStatus: (workspaceId: string): BillingAccessKey =>
    `billing:access:${workspaceId}` as BillingAccessKey,

  /** Full subscription status (contract + access details) */
  subscriptionStatus: (workspaceId: string): BillingStatusKey =>
    `billing:status:${workspaceId}` as BillingStatusKey,
};

export const disputeKeys = {
  /** Whether workspace has an open dispute */
  hasOpen: (workspaceId: string): DisputeOpenKey => `dispute:open:${workspaceId}` as DisputeOpenKey,
};

export const refundKeys = {
  /** Whether workspace has a successful refund */
  hasSuccess: (workspaceId: string): RefundSuccessKey =>
    `refund:success:${workspaceId}` as RefundSuccessKey,
};

export const entitlementKeys = {
  /** Usage summary for a workspace (all resources) */
  usageSummary: (workspaceId: string): EntitlementUsageKey =>
    `entitlement:usage:${workspaceId}` as EntitlementUsageKey,
};

export const linkKeys = {
  /** Link core data (link-specific properties only) */
  core: (workspaceId: string, linkId: string): LinkCoreKey =>
    `link:core:${workspaceId}:${linkId}` as LinkCoreKey,

  /** Lightweight mapping from linkId to workspaceId */
  workspaceMapping: (linkId: string): LinkWorkspaceMappingKey =>
    `link:ws:${linkId}` as LinkWorkspaceMappingKey,
};

export const workspaceRecordingKeys = {
  /** Workspace recording preferences (branding, limits) */
  preferences: (workspaceId: string): WorkspaceRecordingPrefsKey =>
    `workspace:recording-prefs:${workspaceId}` as WorkspaceRecordingPrefsKey,
};

export const domainRecordingKeys = {
  /** Domain recording preferences (capture settings) */
  preferences: (domainId: string): DomainRecordingPrefsKey =>
    `domain:recording-prefs:${domainId}` as DomainRecordingPrefsKey,
};

export const integrationKeys = {
  /** Integration lookup by provider workspace ID */
  byProviderWorkspace: (provider: string, providerWorkspaceId: string): IntegrationKey =>
    `integration:${provider}:${providerWorkspaceId}` as IntegrationKey,
};

export const intercomKeys = {
  /** Raw Intercom admins list for a workspace */
  admins: (workspaceId: string): IntercomAdminsKey =>
    `intercom:admins:${workspaceId}` as IntercomAdminsKey,
};

/**
 * Membership cache keys
 * Used for fast workspace access checks (happens on every API request)
 */
export const membershipKeys = {
  /** User's membership in a workspace (role + memberId) */
  byUserAndWorkspace: (userId: string, workspaceId: string): MembershipKey =>
    `member:${userId}:${workspaceId}` as MembershipKey,
};

/**
 * Workspace existence cache keys
 * Used for fast workspace validation (happens on every API request)
 */
export const workspaceKeys = {
  /** Whether workspace exists and is not deleted */
  exists: (workspaceId: string): WorkspaceExistsKey =>
    `workspace:exists:${workspaceId}` as WorkspaceExistsKey,
};

/**
 * Get cache keys by type
 * Note: Some cache types require async lookups (domain_recording, link, integration)
 * and return empty arrays here - they are handled specially in the diagnostics endpoint
 */
export function getCacheKeysByType(workspaceId: string, type: CacheType): string[] {
  switch (type) {
    case 'billing':
      return [billingKeys.accessStatus(workspaceId), billingKeys.subscriptionStatus(workspaceId)];
    case 'safety_latches':
      // Dispute and refund flags - safety latches that override subscription access
      return [disputeKeys.hasOpen(workspaceId), refundKeys.hasSuccess(workspaceId)];
    case 'entitlement':
      return [entitlementKeys.usageSummary(workspaceId)];
    case 'workspace_recording':
      // Workspace recording preferences (branding, limits)
      return [workspaceRecordingKeys.preferences(workspaceId)];
    case 'domain_recording':
      // Domain recording preferences require domainId lookup
      // Handled specially in diagnostics endpoint
      return [];
    case 'link':
      // Link core cache requires linkId lookup
      // Handled specially in diagnostics endpoint
      return [];
    case 'integration':
      // Integration cache requires provider workspace lookup
      // Handled specially in diagnostics endpoint
      return [];
    case 'all':
      // 'all' is handled by expanding to all types in diagnostics endpoint
      return [];
    default:
      return [];
  }
}

/**
 * Get cache keys for multiple types
 */
export function getCacheKeysByTypes(workspaceId: string, types: CacheType[]): string[] {
  return types.flatMap((type) => getCacheKeysByType(workspaceId, type));
}

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
