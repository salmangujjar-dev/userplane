/**
 * Hono middleware adapter for rate limiting
 *
 * Provides middleware factory functions for different rate limit tiers.
 * Includes response headers and 429 error handling.
 */

import type { Context, MiddlewareHandler } from 'hono';

import type { RateLimiter, RateLimitResult, RateLimitTier } from './limiter';

/**
 * Options for rate limit middleware
 */
export interface RateLimitMiddlewareOptions {
  /** Rate limit tier to apply */
  tier: RateLimitTier;
  /** Function to extract identifier from request (IP, UserID, WorkspaceID) */
  getIdentifier: (c: Context) => string | Promise<string>;
  /** Optional custom response when rate limited */
  onRateLimited?: (c: Context, result: RateLimitResult) => Response | Promise<Response>;
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(c: Context, result: RateLimitResult): void {
  c.header('X-RateLimit-Limit', result.limit.toString());
  c.header('X-RateLimit-Remaining', result.remaining.toString());
  c.header('X-RateLimit-Reset', result.reset.toString());
}

/**
 * Default 429 response
 */
function defaultRateLimitedResponse(c: Context, result: RateLimitResult): Response {
  addRateLimitHeaders(c, result);

  return c.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    },
    429
  );
}

/**
 * Create rate limit middleware for a specific tier
 */
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  options: RateLimitMiddlewareOptions
): MiddlewareHandler {
  return async (c, next) => {
    // Skip if rate limiting is not available
    if (!rateLimiter.isAvailable()) {
      return next();
    }

    // Get identifier for rate limiting
    const identifier = await options.getIdentifier(c);

    // Check rate limit
    const result = await rateLimiter.check(options.tier, identifier);

    // Add headers to all responses
    addRateLimitHeaders(c, result);

    // If rate limited, return 429
    if (!result.success) {
      if (options.onRateLimited) {
        return options.onRateLimited(c, result);
      }
      return defaultRateLimitedResponse(c, result);
    }

    // Continue to next middleware/handler
    return next();
  };
}

/**
 * Get client IP address from request
 *
 * Checks common headers for proxied requests, falls back to direct IP.
 * Order of precedence:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Real-IP (nginx)
 * 3. First IP in X-Forwarded-For
 * 4. Direct connection IP
 */
export function getClientIP(c: Context): string {
  // Cloudflare
  const cfIP = c.req.header('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // nginx proxy
  const realIP = c.req.header('X-Real-IP');
  if (realIP) return realIP;

  // Standard forwarded header
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    const firstIP = forwardedFor.split(',')[0]?.trim();
    if (firstIP) return firstIP;
  }

  // Fall back to unknown - Hono doesn't expose raw socket
  return 'unknown';
}

/**
 * Pre-configured middleware factories for common use cases
 */
export const rateLimitMiddlewares = {
  /**
   * Rate limit by IP for public endpoints
   */
  public: (rateLimiter: RateLimiter): MiddlewareHandler =>
    createRateLimitMiddleware(rateLimiter, {
      tier: 'public',
      getIdentifier: getClientIP,
    }),

  /**
   * Rate limit by IP for session initialization
   */
  session: (rateLimiter: RateLimiter): MiddlewareHandler =>
    createRateLimitMiddleware(rateLimiter, {
      tier: 'session',
      getIdentifier: getClientIP,
    }),

  /**
   * Rate limit by IP for webhooks (high limit)
   */
  webhook: (rateLimiter: RateLimiter): MiddlewareHandler =>
    createRateLimitMiddleware(rateLimiter, {
      tier: 'webhook',
      getIdentifier: getClientIP,
    }),
};
