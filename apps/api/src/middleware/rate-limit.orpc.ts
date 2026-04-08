/**
 * oRPC Rate Limiting Middleware
 *
 * Provides rate limiting middleware for authenticated endpoints.
 * Uses user context to rate limit by UserID or WorkspaceID.
 *
 * Usage:
 * - Import `authorizedRateLimited` for authenticated routes with rate limiting
 * - Import `adminRateLimited` for admin routes with higher limits
 * - Use `billingRateLimitMiddleware` for billing routes (requires workspaceId in context)
 */

import { ORPCError } from '@orpc/server';
import type { RateLimiter, RateLimitTier } from '@userplane/cache';

import { rateLimiter } from '@/api/clients/redis';

import type { AuthContext } from './auth.orpc';
import { authMiddleware, authorized, base } from './auth.orpc';

/**
 * Rate limit error with proper HTTP status
 */
function createRateLimitError(retryAfter?: number): never {
  throw new ORPCError('RATE_LIMIT_EXCEEDED', {
    status: 429,
    message:
      'Rate limit exceeded. Wait and retry with exponential backoff. See https://docs.userplane.io/api/rate-limits',
    data: { retryAfter },
  });
}

/**
 * Create rate limiting middleware for authenticated routes
 * Rate limits by user ID (100 req/min)
 */
export function createAuthenticatedRateLimitMiddleware(limiter: RateLimiter) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    if (!limiter.isAvailable()) {
      return next({});
    }

    const result = await limiter.check('authenticated', context.user.id);

    if (!result.success) {
      createRateLimitError(result.retryAfter);
    }

    return next({});
  });
}

/**
 * Create rate limiting middleware for admin routes
 * Rate limits by user ID with higher limits (200 req/min)
 */
export function createAdminRateLimitMiddleware(limiter: RateLimiter) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    if (!limiter.isAvailable()) {
      return next({});
    }

    const result = await limiter.check('admin', context.user.id);

    if (!result.success) {
      createRateLimitError(result.retryAfter);
    }

    return next({});
  });
}

/**
 * Create rate limiting middleware for billing routes
 * Rate limits by workspace ID (30 req/min)
 */
export function createBillingRateLimitMiddleware(limiter: RateLimiter) {
  return base
    .$context<AuthContext & { workspaceId: string }>()
    .middleware(async ({ context, next }) => {
      if (!limiter.isAvailable()) {
        return next({});
      }

      const result = await limiter.check('billing', context.workspaceId);

      if (!result.success) {
        createRateLimitError(result.retryAfter);
      }

      return next({});
    });
}

/**
 * Create a generic rate limiting middleware for any tier
 */
export function createRateLimitOrpcMiddleware<TContext extends AuthContext>(
  limiter: RateLimiter,
  tier: RateLimitTier,
  getIdentifier: (context: TContext) => string
) {
  return base.$context<TContext>().middleware(async ({ context, next }) => {
    if (!limiter.isAvailable()) {
      return next({});
    }

    const identifier = getIdentifier(context);
    const result = await limiter.check(tier, identifier);

    if (!result.success) {
      createRateLimitError(result.retryAfter);
    }

    return next({});
  });
}

// ============================================================
// Pre-configured middleware instances using the global rateLimiter
// ============================================================

/**
 * Rate limiting middleware for authenticated routes (100 req/min per user)
 */
export const authenticatedRateLimitMiddleware = createAuthenticatedRateLimitMiddleware(rateLimiter);

/**
 * Rate limiting middleware for admin routes (200 req/min per user)
 */
export const adminRateLimitMiddleware = createAdminRateLimitMiddleware(rateLimiter);

/**
 * Rate limiting middleware for billing routes (30 req/min per workspace)
 */
export const billingRateLimitMiddleware = createBillingRateLimitMiddleware(rateLimiter);

// ============================================================
// Combined auth + rate limit bases for easy use in routes
// ============================================================

/**
 * Authenticated base with rate limiting for general authenticated routes
 * Use this instead of `authorized` for routes that need rate limiting
 */
export const authorizedRateLimited = authorized.use(authenticatedRateLimitMiddleware);

/**
 * Combined auth + admin rate limit middleware
 * For admin routes that need the higher rate limit
 */
export const authWithAdminRateLimit = base.use(authMiddleware).use(adminRateLimitMiddleware);
