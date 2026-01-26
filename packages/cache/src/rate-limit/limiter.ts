/**
 * Rate limiter with tier-based configuration
 *
 * Uses @upstash/ratelimit for distributed rate limiting with Redis.
 * Supports multiple tiers for different endpoint categories.
 */

import { Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';

/**
 * Rate limit tiers
 */
export type RateLimitTier =
  | 'public'
  | 'session'
  | 'authenticated'
  | 'billing'
  | 'admin'
  | 'webhook';

/**
 * Rate limit configuration per tier
 */
export interface TierConfig {
  /** Maximum requests in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Description for logging */
  description: string;
}

/**
 * Tier configurations
 *
 * | Tier | Endpoints | Window | Max Requests | Identifier |
 * |------|-----------|--------|--------------|------------|
 * | public | /, /health, /invite/validate, /domains/verify | 60s | 60 | IP |
 * | session | GET /session (recording init) | 60s | 30 | IP |
 * | authenticated | Workspace, project, recording, link routes | 60s | 100 | UserID |
 * | billing | /billing/* | 60s | 30 | WorkspaceID |
 * | admin | /admin/* | 60s | 200 | UserID |
 * | webhook | /api/auth/dodopayments/webhooks/* | 60s | 1000 | IP |
 */
export const TIER_CONFIGS: Record<RateLimitTier, TierConfig> = {
  public: {
    limit: 60,
    windowSeconds: 60,
    description: 'Public endpoints (/, /health, /invite, /domains)',
  },
  session: {
    limit: 30,
    windowSeconds: 60,
    description: 'Session initialization endpoints',
  },
  authenticated: {
    limit: 100,
    windowSeconds: 60,
    description: 'Authenticated API endpoints',
  },
  billing: {
    limit: 30,
    windowSeconds: 60,
    description: 'Billing endpoints',
  },
  admin: {
    limit: 200,
    windowSeconds: 60,
    description: 'Admin endpoints',
  },
  webhook: {
    limit: 1000,
    windowSeconds: 60,
    description: 'Webhook endpoints (high limit to ensure processing)',
  },
};

/**
 * Result from rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets */
  reset: number;
  /** Seconds until retry (only set when blocked) */
  retryAfter?: number;
}

/**
 * Rate limiter instance per tier
 */
export class RateLimiter {
  private limiters: Map<RateLimitTier, Ratelimit>;
  private enabled: boolean;

  constructor(redis: Redis | null, enabled: boolean = true) {
    this.limiters = new Map();
    this.enabled = enabled && redis !== null;

    if (redis && this.enabled) {
      // Create a rate limiter for each tier
      for (const [tier, config] of Object.entries(TIER_CONFIGS)) {
        this.limiters.set(
          tier as RateLimitTier,
          new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
            prefix: `ratelimit:${tier}`,
            analytics: true,
          })
        );
      }
    }
  }

  /**
   * Check if rate limiting is available
   */
  isAvailable(): boolean {
    return this.enabled && this.limiters.size > 0;
  }

  /**
   * Check rate limit for an identifier
   *
   * @param tier - The rate limit tier to use
   * @param identifier - Unique identifier (IP, UserID, or WorkspaceID)
   * @returns Rate limit result with success status and headers
   */
  async check(tier: RateLimitTier, identifier: string): Promise<RateLimitResult> {
    // If rate limiting is disabled, always allow
    if (!this.enabled) {
      return {
        success: true,
        limit: TIER_CONFIGS[tier].limit,
        remaining: TIER_CONFIGS[tier].limit,
        reset: Math.floor(Date.now() / 1000) + TIER_CONFIGS[tier].windowSeconds,
      };
    }

    const limiter = this.limiters.get(tier);

    if (!limiter) {
      // Fail open if limiter not found
      console.warn(`[RateLimit] No limiter found for tier: ${tier}`);
      return {
        success: true,
        limit: TIER_CONFIGS[tier].limit,
        remaining: TIER_CONFIGS[tier].limit,
        reset: Math.floor(Date.now() / 1000) + TIER_CONFIGS[tier].windowSeconds,
      };
    }

    try {
      const result = await limiter.limit(identifier);

      const response: RateLimitResult = {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };

      // Add retryAfter if blocked
      if (!result.success) {
        const now = Date.now();
        response.retryAfter = Math.ceil((result.reset - now) / 1000);
      }

      return response;
    } catch (error) {
      // Fail open on errors
      console.warn(`[RateLimit] Error checking rate limit for ${tier}:${identifier}:`, error);
      return {
        success: true,
        limit: TIER_CONFIGS[tier].limit,
        remaining: TIER_CONFIGS[tier].limit,
        reset: Math.floor(Date.now() / 1000) + TIER_CONFIGS[tier].windowSeconds,
      };
    }
  }
}
