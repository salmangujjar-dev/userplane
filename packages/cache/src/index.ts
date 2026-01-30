/**
 * @workspace/cache - Redis caching and rate limiting
 *
 * Provides:
 * - Redis client management
 * - Type-safe caching with graceful degradation
 * - Tier-based rate limiting with Hono middleware
 */

// Client
export type { RedisConfig } from './client';
export { createRedisClient, getRedisClient, isRedisAvailable } from './client';

// Cache
export type {
  CacheOptions,
  CacheServiceConfig,
  DomainRecordingPrefs,
  LinkCore,
  UsageSummary,
  WorkspaceRecordingPrefs,
} from './cache/cache-service';
export {
  CACHE_BYPASS_HEADER,
  CacheService,
  getCacheOptionsFromHeaders,
} from './cache/cache-service';
export * from './cache/keys';
export * from './cache/ttl';

// Rate limiting
export type { RateLimitResult, RateLimitTier, TierConfig } from './rate-limit/limiter';
export { RateLimiter, TIER_CONFIGS } from './rate-limit/limiter';
export type { RateLimitMiddlewareOptions } from './rate-limit/middleware';
export {
  createRateLimitMiddleware,
  getClientIP,
  rateLimitMiddlewares,
} from './rate-limit/middleware';
