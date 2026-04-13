/**
 * Rate limiter with tier-based configuration
 *
 * Uses @upstash/ratelimit for distributed rate limiting with Redis.
 * Supports multiple tiers for different endpoint categories.
 */

import { Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';

import { createCacheLogger } from '../logger';

/**
 * Rate limit tiers
 */
export type RateLimitTier =
  | 'public'
  | 'session'
  | 'authenticated'
  | 'billing'
  | 'admin'
  | 'webhook'
  | 'mcp'
  | 'mcp_user_minute'
  | 'mcp_user_day';

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
 * | mcp | /mcp pre-auth DoS shield | 60s | 3000 | IP |
 * | mcp_user_minute | /mcp post-auth per-user minute | 60s | 120 | UserID |
 * | mcp_user_day | /mcp post-auth per-user day | 86400s | 10000 | UserID |
 *
 * Values here are compile-time fallback defaults. Callers can override per tier
 * at `RateLimiter` construction time — see the `tierOverrides` constructor
 * parameter. MCP tiers in particular are meant to be driven from env vars.
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
  mcp: {
    limit: 3000,
    windowSeconds: 60,
    description: 'MCP pre-auth IP ceiling (DoS shield, shared-egress friendly)',
  },
  mcp_user_minute: {
    limit: 120,
    windowSeconds: 60,
    description: 'MCP post-auth per-user minute window',
  },
  mcp_user_day: {
    limit: 10000,
    windowSeconds: 86_400,
    description: 'MCP post-auth per-user day window',
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
 * Per-tier override for the fallback defaults in `TIER_CONFIGS`.
 *
 * Use this to drive limits from environment variables without mutating the
 * exported `TIER_CONFIGS` constant. Any omitted tier (or omitted field) falls
 * back to the compile-time default.
 */
export type TierOverrides = Partial<Record<RateLimitTier, Partial<TierConfig>>>;

/**
 * Rate limiter instance per tier
 */
export class RateLimiter {
  private limiters: Map<RateLimitTier, Ratelimit>;
  private effectiveConfig: Map<RateLimitTier, TierConfig>;
  private enabled: boolean;
  private logger = createCacheLogger('RateLimiter');

  constructor(redis: Redis | null, enabled: boolean = true, tierOverrides: TierOverrides = {}) {
    this.limiters = new Map();
    this.effectiveConfig = new Map();
    this.enabled = enabled && redis !== null;

    // Build the effective config once (overrides merged on top of defaults)
    // so both Ratelimit construction and fail-open paths see the same values.
    for (const [tier, config] of Object.entries(TIER_CONFIGS) as Array<
      [RateLimitTier, TierConfig]
    >) {
      const override = tierOverrides[tier] ?? {};
      this.effectiveConfig.set(tier, { ...config, ...override });
    }

    if (redis && this.enabled) {
      // Create a rate limiter for each tier
      for (const [tier, effective] of this.effectiveConfig) {
        this.limiters.set(
          tier,
          new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(effective.limit, `${effective.windowSeconds} s`),
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
    const effective = this.effectiveConfig.get(tier) ?? TIER_CONFIGS[tier];

    // If rate limiting is disabled, always allow
    if (!this.enabled) {
      return {
        success: true,
        limit: effective.limit,
        remaining: effective.limit,
        reset: Math.floor(Date.now() / 1000) + effective.windowSeconds,
      };
    }

    const limiter = this.limiters.get(tier);

    if (!limiter) {
      // Fail open if limiter not found
      this.logger.warn({ tier }, 'No limiter found for tier');
      return {
        success: true,
        limit: effective.limit,
        remaining: effective.limit,
        reset: Math.floor(Date.now() / 1000) + effective.windowSeconds,
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
      this.logger.warn({ err: error, tier, identifier }, 'Error checking rate limit');
      return {
        success: true,
        limit: effective.limit,
        remaining: effective.limit,
        reset: Math.floor(Date.now() / 1000) + effective.windowSeconds,
      };
    }
  }
}
