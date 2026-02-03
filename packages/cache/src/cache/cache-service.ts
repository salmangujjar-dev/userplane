/**
 * CacheService - Type-safe cache operations
 *
 * Provides caching with graceful degradation. All operations:
 * - Return null on cache miss or error (fail open)
 * - Log warnings for monitoring but don't throw
 * - Support cache bypass header for debugging
 */

import type { Redis } from '@upstash/redis';
import type {
  DomainRecordingPrefs,
  LinkCore,
  SubscriptionAccessStatus,
  SubscriptionStatusData,
  UsageSummary,
  WorkspaceRecordingPrefs,
} from '@workspace/contract';

import {
  billingKeys,
  disputeKeys,
  domainRecordingKeys,
  entitlementKeys,
  getWorkspaceBillingKeys,
  integrationKeys,
  intercomKeys,
  linkKeys,
  membershipKeys,
  refundKeys,
  workspaceKeys,
  workspaceRecordingKeys,
} from './keys';
import { TTL } from './ttl';

// Re-export cache types from contract
export type {
  DomainRecordingPrefs,
  LinkCore,
  UsageSummary,
  WorkspaceRecordingPrefs,
} from '@workspace/contract';

export interface CacheServiceConfig {
  redis: Redis | null;
  enabled: boolean;
}

/**
 * Cache operation options
 */
export interface CacheOptions {
  /** Skip cache lookup, force database query */
  bypass?: boolean;
}

/**
 * HTTP header name for cache bypass
 * Set to any truthy value to skip cache for debugging
 * Example: X-Cache-Bypass: 1
 */
export const CACHE_BYPASS_HEADER = 'x-cache-bypass';

/**
 * Extract cache options from HTTP headers
 * Use in route handlers to propagate bypass flag to services
 */
export function getCacheOptionsFromHeaders(headers: Headers): CacheOptions {
  const bypass = headers.get(CACHE_BYPASS_HEADER);
  return { bypass: !!bypass };
}

export class CacheService {
  private redis: Redis | null;
  private enabled: boolean;

  constructor(config: CacheServiceConfig) {
    this.redis = config.redis;
    this.enabled = config.enabled && config.redis !== null;
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return this.enabled && this.redis !== null;
  }

  // ============================================================
  // Internal cache operations (use typed methods below instead)
  // ============================================================

  /** Internal: Get value from cache. Use typed methods for public API. */
  private async _get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      console.warn(`[Cache] GET error for ${key}:`, error);
      return null;
    }
  }

  /** Internal: Set value in cache with TTL. Use typed methods for public API. */
  private async _set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.warn(`[Cache] SET error for ${key}:`, error);
    }
  }

  /**
   * Batch get multiple values from cache
   * Returns array in same order as keys, with null for misses
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget<(T | null)[]>(...keys);
      return values;
    } catch (error) {
      console.warn(`[Cache] MGET error for ${keys.length} keys:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple values with same TTL using pipeline
   * More efficient than individual sets for bulk operations
   */
  async mset<T>(entries: Array<{ key: string; value: T }>, ttlSeconds: number): Promise<void> {
    if (!this.enabled || !this.redis || entries.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();
      for (const { key, value } of entries) {
        pipeline.set(key, value, { ex: ttlSeconds });
      }
      await pipeline.exec();
    } catch (error) {
      console.warn(`[Cache] MSET error for ${entries.length} entries:`, error);
    }
  }

  /**
   * Delete one or more keys from cache
   * Accepts branded key types for type safety
   */
  async delete(...keys: string[]): Promise<void> {
    if (!this.enabled || !this.redis || keys.length === 0) return;

    try {
      await this.redis.del(...keys);
    } catch (error) {
      console.warn(`[Cache] DEL error for ${keys.join(', ')}:`, error);
    }
  }

  // ============================================================
  // Typed cache operations for billing
  // ============================================================

  /**
   * Get cached subscription access status
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getSubscriptionAccessStatus(
    workspaceId: string,
    options?: CacheOptions
  ): Promise<SubscriptionAccessStatus | null> {
    if (options?.bypass) return null;
    const key = billingKeys.accessStatus(workspaceId);
    return this._get<SubscriptionAccessStatus>(key);
  }

  /**
   * Cache subscription access status
   */
  async setSubscriptionAccessStatus(
    workspaceId: string,
    status: SubscriptionAccessStatus
  ): Promise<void> {
    const key = billingKeys.accessStatus(workspaceId);
    await this._set(key, status, TTL.BILLING_ACCESS);
  }

  /**
   * Get cached subscription status (full status for billing page)
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getSubscriptionStatus(
    workspaceId: string,
    options?: CacheOptions
  ): Promise<SubscriptionStatusData | null> {
    if (options?.bypass) return null;
    const key = billingKeys.subscriptionStatus(workspaceId);
    return this._get<SubscriptionStatusData>(key);
  }

  /**
   * Cache subscription status (full status for billing page)
   */
  async setSubscriptionStatus(workspaceId: string, status: SubscriptionStatusData): Promise<void> {
    const key = billingKeys.subscriptionStatus(workspaceId);
    await this._set(key, status, TTL.BILLING_STATUS);
  }

  // ============================================================
  // Typed cache operations for entitlements
  // ============================================================

  /**
   * Get cached usage summary
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getUsageSummary(workspaceId: string, options?: CacheOptions): Promise<UsageSummary | null> {
    if (options?.bypass) return null;
    const key = entitlementKeys.usageSummary(workspaceId);
    return this._get<UsageSummary>(key);
  }

  /**
   * Cache usage summary
   */
  async setUsageSummary(workspaceId: string, summary: UsageSummary): Promise<void> {
    const key = entitlementKeys.usageSummary(workspaceId);
    await this._set(key, summary, TTL.ENTITLEMENT_USAGE);
  }

  // ============================================================
  // Link workspace mapping (for cache-first pattern)
  // Enables lookups when only linkId is known
  // ============================================================

  /**
   * Get cached linkId -> workspaceId mapping
   * Enables cache-first pattern when only linkId is available
   */
  async getLinkWorkspaceMapping(linkId: string, options?: CacheOptions): Promise<string | null> {
    if (options?.bypass) return null;
    const key = linkKeys.workspaceMapping(linkId);
    return this._get<string>(key);
  }

  /**
   * Cache linkId -> workspaceId mapping
   */
  async setLinkWorkspaceMapping(linkId: string, workspaceId: string): Promise<void> {
    const key = linkKeys.workspaceMapping(linkId);
    await this._set(key, workspaceId, TTL.LINK_WORKSPACE_MAPPING);
  }

  /**
   * Invalidate linkId -> workspaceId mapping
   */
  async invalidateLinkWorkspaceMapping(linkId: string): Promise<void> {
    const key = linkKeys.workspaceMapping(linkId);
    await this.delete(key);
  }

  // ============================================================
  // Normalized cache operations for session initialization
  // Workspace prefs + Domain prefs + Link core = Session data
  // ============================================================

  /**
   * Get cached workspace recording preferences
   */
  async getWorkspaceRecordingPrefs(
    workspaceId: string,
    options?: CacheOptions
  ): Promise<WorkspaceRecordingPrefs | null> {
    if (options?.bypass) return null;
    const key = workspaceRecordingKeys.preferences(workspaceId);
    return this._get<WorkspaceRecordingPrefs>(key);
  }

  /**
   * Cache workspace recording preferences
   */
  async setWorkspaceRecordingPrefs(
    workspaceId: string,
    prefs: WorkspaceRecordingPrefs
  ): Promise<void> {
    const key = workspaceRecordingKeys.preferences(workspaceId);
    await this._set(key, prefs, TTL.WORKSPACE_RECORDING_PREFS);
  }

  /**
   * Invalidate workspace recording preferences cache
   * O(1) operation - replaces invalidating all link caches in workspace
   */
  async invalidateWorkspaceRecordingPrefs(workspaceId: string): Promise<void> {
    const key = workspaceRecordingKeys.preferences(workspaceId);
    await this.delete(key);
  }

  /**
   * Get cached domain recording preferences
   */
  async getDomainRecordingPrefs(
    domainId: string,
    options?: CacheOptions
  ): Promise<DomainRecordingPrefs | null> {
    if (options?.bypass) return null;
    const key = domainRecordingKeys.preferences(domainId);
    return this._get<DomainRecordingPrefs>(key);
  }

  /**
   * Cache domain recording preferences
   */
  async setDomainRecordingPrefs(domainId: string, prefs: DomainRecordingPrefs): Promise<void> {
    const key = domainRecordingKeys.preferences(domainId);
    await this._set(key, prefs, TTL.DOMAIN_RECORDING_PREFS);
  }

  /**
   * Invalidate domain recording preferences cache
   * O(1) operation - replaces invalidating all link caches in domain
   */
  async invalidateDomainRecordingPrefs(domainId: string): Promise<void> {
    const key = domainRecordingKeys.preferences(domainId);
    await this.delete(key);
  }

  /**
   * Invalidate domain recording preferences for multiple domains (batch)
   */
  async invalidateDomainRecordingPrefsBatch(domainIds: string[]): Promise<void> {
    if (domainIds.length === 0) return;
    const keys = domainIds.map((id) => domainRecordingKeys.preferences(id));
    await this.delete(...keys);
  }

  /**
   * Get cached link core data
   */
  async getLinkCore(
    workspaceId: string,
    linkId: string,
    options?: CacheOptions
  ): Promise<LinkCore | null> {
    if (options?.bypass) return null;
    const key = linkKeys.core(workspaceId, linkId);
    return this._get<LinkCore>(key);
  }

  /**
   * Cache link core data
   */
  async setLinkCore(workspaceId: string, linkId: string, core: LinkCore): Promise<void> {
    const key = linkKeys.core(workspaceId, linkId);
    await this._set(key, core, TTL.LINK_CORE);
  }

  /**
   * Invalidate link core cache
   * O(1) operation - only the specific link
   */
  async invalidateLinkCore(workspaceId: string, linkId: string): Promise<void> {
    const key = linkKeys.core(workspaceId, linkId);
    await this.delete(key);
  }

  /**
   * Invalidate all link-related caches for a single link
   * Clears both link core and workspace mapping
   */
  async invalidateLinkFull(workspaceId: string, linkId: string): Promise<void> {
    await this.delete(linkKeys.core(workspaceId, linkId), linkKeys.workspaceMapping(linkId));
  }

  /**
   * Invalidate link caches for multiple links (batch operation)
   * Used during bulk deletions (project/workspace deletion)
   */
  async invalidateLinksBatch(workspaceId: string, linkIds: string[]): Promise<void> {
    if (linkIds.length === 0) return;
    const keys = linkIds.flatMap((id) => [
      linkKeys.core(workspaceId, id),
      linkKeys.workspaceMapping(id),
    ]);
    await this.delete(...keys);
  }

  // ============================================================
  // Bulk invalidation for workspace-level operations
  // ============================================================

  /**
   * Invalidate all billing-related caches for a workspace
   * Called after subscription, dispute, or refund webhooks
   */
  async invalidateWorkspaceBilling(workspaceId: string): Promise<void> {
    const keys = getWorkspaceBillingKeys(workspaceId);
    await this.delete(...keys);
  }

  /**
   * Invalidate dispute cache for a workspace
   * Uses single delete call for both dispute and access status keys
   */
  async invalidateDispute(workspaceId: string): Promise<void> {
    // Batch delete: dispute status and access status (disputes affect access)
    await this.delete(disputeKeys.hasOpen(workspaceId), billingKeys.accessStatus(workspaceId));
  }

  /**
   * Invalidate refund cache for a workspace
   * Uses single delete call for both refund and access status keys
   */
  async invalidateRefund(workspaceId: string): Promise<void> {
    // Batch delete: refund status and access status (refunds affect access)
    await this.delete(refundKeys.hasSuccess(workspaceId), billingKeys.accessStatus(workspaceId));
  }

  /**
   * Invalidate entitlement usage cache for a workspace
   * Called after resource consumption or plan changes
   */
  async invalidateUsage(workspaceId: string): Promise<void> {
    const usageKey = entitlementKeys.usageSummary(workspaceId);
    await this.delete(usageKey);
  }

  // ============================================================
  // Typed cache operations for integrations
  // ============================================================

  /**
   * Cached integration data
   */
  async getIntegrationByProviderWorkspace<T>(
    provider: string,
    providerWorkspaceId: string,
    options?: CacheOptions
  ): Promise<T | null> {
    if (options?.bypass) return null;
    const key = integrationKeys.byProviderWorkspace(provider, providerWorkspaceId);
    return this._get<T>(key);
  }

  /**
   * Cache integration lookup result
   */
  async setIntegrationByProviderWorkspace<T>(
    provider: string,
    providerWorkspaceId: string,
    integration: T
  ): Promise<void> {
    const key = integrationKeys.byProviderWorkspace(provider, providerWorkspaceId);
    await this._set(key, integration, TTL.INTEGRATION_LOOKUP);
  }

  /**
   * Invalidate integration cache
   * Called when integration is connected/disconnected
   */
  async invalidateIntegration(provider: string, providerWorkspaceId: string): Promise<void> {
    const key = integrationKeys.byProviderWorkspace(provider, providerWorkspaceId);
    await this.delete(key);
  }

  // ============================================================
  // Intercom admins cache (reduces external API calls)
  // ============================================================

  /**
   * Get cached Intercom admins list
   * Returns raw admin data from Intercom API
   */
  async getIntercomAdmins<T>(workspaceId: string, options?: CacheOptions): Promise<T[] | null> {
    if (options?.bypass) return null;
    const key = intercomKeys.admins(workspaceId);
    return this._get<T[]>(key);
  }

  /**
   * Cache Intercom admins list
   */
  async setIntercomAdmins<T>(workspaceId: string, admins: T[]): Promise<void> {
    const key = intercomKeys.admins(workspaceId);
    await this._set(key, admins, TTL.INTERCOM_ADMINS);
  }

  /**
   * Invalidate all Intercom-related caches for a workspace
   * Called when integration is disconnected
   */
  async invalidateIntercom(workspaceId: string, providerWorkspaceId: string): Promise<void> {
    await this.delete(
      integrationKeys.byProviderWorkspace('intercom', providerWorkspaceId),
      intercomKeys.admins(workspaceId)
    );
  }

  // ============================================================
  // Membership cache (hot path - every authenticated request)
  // ============================================================

  /**
   * Get cached membership for user in workspace
   */
  async getMembership(
    userId: string,
    workspaceId: string,
    options?: CacheOptions
  ): Promise<{ workspaceMemberId: string; workspaceRole: string } | null> {
    if (options?.bypass) return null;
    const key = membershipKeys.byUserAndWorkspace(userId, workspaceId);
    return this._get<{ workspaceMemberId: string; workspaceRole: string }>(key);
  }

  /**
   * Cache membership data
   */
  async setMembership(
    userId: string,
    workspaceId: string,
    membership: { workspaceMemberId: string; workspaceRole: string }
  ): Promise<void> {
    const key = membershipKeys.byUserAndWorkspace(userId, workspaceId);
    await this._set(key, membership, TTL.MEMBERSHIP);
  }

  /**
   * Invalidate membership cache
   * Called when member role changes or member is removed
   */
  async invalidateMembership(userId: string, workspaceId: string): Promise<void> {
    const key = membershipKeys.byUserAndWorkspace(userId, workspaceId);
    await this.delete(key);
  }

  // ============================================================
  // Workspace existence cache (hot path - every workspace request)
  // ============================================================

  /**
   * Get cached workspace existence
   * Returns workspaceId if exists, null if not cached or doesn't exist
   */
  async getWorkspaceExists(workspaceId: string, options?: CacheOptions): Promise<boolean | null> {
    if (options?.bypass) return null;
    const key = workspaceKeys.exists(workspaceId);
    return this._get<boolean>(key);
  }

  /**
   * Cache workspace existence
   */
  async setWorkspaceExists(workspaceId: string, exists: boolean): Promise<void> {
    const key = workspaceKeys.exists(workspaceId);
    await this._set(key, exists, TTL.WORKSPACE_EXISTS);
  }

  /**
   * Invalidate workspace existence cache
   * Called when workspace is deleted or restored
   */
  async invalidateWorkspaceExists(workspaceId: string): Promise<void> {
    const key = workspaceKeys.exists(workspaceId);
    await this.delete(key);
  }
}
