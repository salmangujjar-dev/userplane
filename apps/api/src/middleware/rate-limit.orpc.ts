/**
 * oRPC Rate Limiting Middleware
 *
 * Provides rate limiting middleware for authenticated endpoints.
 * Uses user context to rate limit by UserID or WorkspaceID.
 */

import type { RateLimiter, RateLimitTier } from '@workspace/cache';

import type { AuthContext } from './auth.orpc';
import { base } from './auth.orpc';

/**
 * Create rate limiting middleware for authenticated routes
 * Rate limits by user ID
 */
export function createAuthenticatedRateLimitMiddleware(rateLimiter: RateLimiter) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    if (!rateLimiter.isAvailable()) {
      return next({});
    }

    const result = await rateLimiter.check('authenticated', context.user.id);

    if (!result.success) {
      const error = new Error('Rate limit exceeded');
      (error as Error & { status?: number }).status = 429;
      (error as Error & { code?: string }).code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    return next({});
  });
}

/**
 * Create rate limiting middleware for admin routes
 * Rate limits by user ID with higher limits
 */
export function createAdminRateLimitMiddleware(rateLimiter: RateLimiter) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    if (!rateLimiter.isAvailable()) {
      return next({});
    }

    const result = await rateLimiter.check('admin', context.user.id);

    if (!result.success) {
      const error = new Error('Rate limit exceeded');
      (error as Error & { status?: number }).status = 429;
      (error as Error & { code?: string }).code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    return next({});
  });
}

/**
 * Create rate limiting middleware for billing routes
 * Rate limits by workspace ID
 */
export function createBillingRateLimitMiddleware(rateLimiter: RateLimiter) {
  return base
    .$context<AuthContext & { workspaceId: string }>()
    .middleware(async ({ context, next }) => {
      if (!rateLimiter.isAvailable()) {
        return next({});
      }

      const result = await rateLimiter.check('billing', context.workspaceId);

      if (!result.success) {
        const error = new Error('Rate limit exceeded');
        (error as Error & { status?: number }).status = 429;
        (error as Error & { code?: string }).code = 'RATE_LIMIT_EXCEEDED';
        throw error;
      }

      return next({});
    });
}

/**
 * Create a generic rate limiting middleware for any tier
 * @param rateLimiter - The rate limiter instance
 * @param tier - The rate limit tier to use
 * @param getIdentifier - Function to extract identifier from context
 */
export function createRateLimitOrpcMiddleware<TContext extends AuthContext>(
  rateLimiter: RateLimiter,
  tier: RateLimitTier,
  getIdentifier: (context: TContext) => string
) {
  return base.$context<TContext>().middleware(async ({ context, next }) => {
    if (!rateLimiter.isAvailable()) {
      return next({});
    }

    const identifier = getIdentifier(context);
    const result = await rateLimiter.check(tier, identifier);

    if (!result.success) {
      const error = new Error('Rate limit exceeded');
      (error as Error & { status?: number }).status = 429;
      (error as Error & { code?: string }).code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    return next({});
  });
}
