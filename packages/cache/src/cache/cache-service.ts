/**
 * CacheService - Type-safe cache operations
 *
 * Provides caching with graceful degradation. All operations:
 * - Return null on cache miss or error (fail open)
 * - Log warnings for monitoring but don't throw
 * - Support cache bypass header for debugging
 */

import type { Redis } from '@upstash/redis';
import type { SubscriptionAccessStatus, SubscriptionStatusData } from '@workspace/contract';

import {
  billingKeys,
  disputeKeys,
  entitlementKeys,
  getWorkspaceBillingKeys,
  linkKeys,
  refundKeys,
} from './keys';
import { TTL } from './ttl';

/**
 * Cached usage summary
 */
export interface CachedUsageSummary {
  planId: string;
  planName: string;
  resources: Record<
    string,
    {
      consumed: number;
      limit: number;
      percentUsed: number;
    }
  >;
}

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
  // Generic cache operations with graceful degradation
  // ============================================================

  /**
   * Get value from cache
   * Returns null on miss or error
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      console.warn(`[Cache] GET error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * Silently fails on error
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.warn(`[Cache] SET error for ${key}:`, error);
    }
  }

  /**
   * Delete one or more keys from cache
   * Silently fails on error
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
    return this.get<SubscriptionAccessStatus>(key);
  }

  /**
   * Cache subscription access status
   */
  async setSubscriptionAccessStatus(
    workspaceId: string,
    status: SubscriptionAccessStatus
  ): Promise<void> {
    const key = billingKeys.accessStatus(workspaceId);
    await this.set(key, status, TTL.BILLING_ACCESS);
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
    return this.get<SubscriptionStatusData>(key);
  }

  /**
   * Cache subscription status (full status for billing page)
   */
  async setSubscriptionStatus(workspaceId: string, status: SubscriptionStatusData): Promise<void> {
    const key = billingKeys.subscriptionStatus(workspaceId);
    await this.set(key, status, TTL.BILLING_STATUS);
  }

  /**
   * Get cached dispute status
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getHasOpenDispute(workspaceId: string, options?: CacheOptions): Promise<boolean | null> {
    if (options?.bypass) return null;
    const key = disputeKeys.hasOpen(workspaceId);
    return this.get<boolean>(key);
  }

  /**
   * Cache dispute status
   */
  async setHasOpenDispute(workspaceId: string, hasDispute: boolean): Promise<void> {
    const key = disputeKeys.hasOpen(workspaceId);
    await this.set(key, hasDispute, TTL.DISPUTE_OPEN);
  }

  /**
   * Get cached refund status
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getHasSuccessfulRefund(
    workspaceId: string,
    options?: CacheOptions
  ): Promise<boolean | null> {
    if (options?.bypass) return null;
    const key = refundKeys.hasSuccess(workspaceId);
    return this.get<boolean>(key);
  }

  /**
   * Cache refund status
   */
  async setHasSuccessfulRefund(workspaceId: string, hasRefund: boolean): Promise<void> {
    const key = refundKeys.hasSuccess(workspaceId);
    await this.set(key, hasRefund, TTL.REFUND_SUCCESS);
  }

  // ============================================================
  // Typed cache operations for entitlements
  // ============================================================

  /**
   * Get cached usage summary
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getUsageSummary(
    workspaceId: string,
    options?: CacheOptions
  ): Promise<CachedUsageSummary | null> {
    if (options?.bypass) return null;
    const key = entitlementKeys.usageSummary(workspaceId);
    return this.get<CachedUsageSummary>(key);
  }

  /**
   * Cache usage summary
   */
  async setUsageSummary(workspaceId: string, summary: CachedUsageSummary): Promise<void> {
    const key = entitlementKeys.usageSummary(workspaceId);
    await this.set(key, summary, TTL.ENTITLEMENT_USAGE);
  }

  // ============================================================
  // Typed cache operations for links
  // ============================================================

  /**
   * Get cached link preferences
   * @param options.bypass - If true, returns null to force database lookup
   */
  async getLinkPreferences<T>(linkId: string, options?: CacheOptions): Promise<T | null> {
    if (options?.bypass) return null;
    const key = linkKeys.preferences(linkId);
    return this.get<T>(key);
  }

  /**
   * Cache link preferences
   */
  async setLinkPreferences<T>(linkId: string, preferences: T): Promise<void> {
    const key = linkKeys.preferences(linkId);
    await this.set(key, preferences, TTL.LINK_PREFERENCES);
  }

  /**
   * Invalidate link preferences cache
   */
  async invalidateLinkPreferences(linkId: string): Promise<void> {
    const key = linkKeys.preferences(linkId);
    await this.delete(key);
  }

  // ============================================================
  // Bulk invalidation
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
   */
  async invalidateDispute(workspaceId: string): Promise<void> {
    const key = disputeKeys.hasOpen(workspaceId);
    await this.delete(key);
    // Also invalidate access status since disputes affect it
    await this.delete(billingKeys.accessStatus(workspaceId));
  }

  /**
   * Invalidate refund cache for a workspace
   */
  async invalidateRefund(workspaceId: string): Promise<void> {
    const key = refundKeys.hasSuccess(workspaceId);
    await this.delete(key);
    // Also invalidate access status since refunds affect it
    await this.delete(billingKeys.accessStatus(workspaceId));
  }

  /**
   * Invalidate entitlement usage cache for a workspace
   * Called after resource consumption or plan changes
   */
  async invalidateUsage(workspaceId: string): Promise<void> {
    const key = entitlementKeys.usageSummary(workspaceId);
    await this.delete(key);
  }
}
