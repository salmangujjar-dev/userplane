/**
 * @workspace/cache - Redis caching and rate limiting
 *
 * Provides:
 * - Redis client management
 * - Type-safe caching with graceful degradation
 * - Tier-based rate limiting with Hono middleware
 */

// Client
export { createRedisClient, getRedisClient, isRedisAvailable } from './client';
export type { RedisConfig } from './client';

// Cache
export { CacheService } from './cache/cache-service';
export type { CachedUsageSummary, CacheServiceConfig } from './cache/cache-service';
export * from './cache/keys';
export * from './cache/ttl';

// Rate limiting
export { RateLimiter, TIER_CONFIGS } from './rate-limit/limiter';
export type { RateLimitResult, RateLimitTier, TierConfig } from './rate-limit/limiter';
export {
  createRateLimitMiddleware,
  getClientIP,
  rateLimitMiddlewares,
} from './rate-limit/middleware';
export type { RateLimitMiddlewareOptions } from './rate-limit/middleware';
