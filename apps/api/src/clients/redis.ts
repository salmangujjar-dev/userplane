/**
 * Redis client initialization
 *
 * Creates and exports Redis client, cache service, and rate limiter instances.
 * Gracefully handles missing configuration by returning null/disabled instances.
 */

import { CacheService, createRedisClient, RateLimiter, type RedisConfig } from '@workspace/cache';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';

const logger = createLogger('redis');

/**
 * Get Redis configuration from environment
 */
function getRedisConfig(): RedisConfig | null {
  if (!env.redis.url || !env.redis.token) {
    logger.warn('Redis not configured - caching and rate limiting disabled');
    return null;
  }
  return {
    url: env.redis.url,
    token: env.redis.token,
  };
}

/**
 * Redis client instance
 */
export const redis = createRedisClient(getRedisConfig());

/**
 * Cache service instance
 */
export const cacheService = new CacheService({
  redis,
  enabled: env.cache.enabled,
});

/**
 * Rate limiter instance
 */
export const rateLimiter = new RateLimiter(redis, env.rateLimit.enabled);

// Log initialization status
if (redis) {
  logger.debug(
    {
      cacheEnabled: env.cache.enabled,
      rateLimitEnabled: env.rateLimit.enabled,
    },
    'Redis client initialized'
  );
} else {
  logger.warn('Redis client not initialized - running without caching and rate limiting');
}

/**
 * Check if Redis services are available
 */
export function isRedisConfigured(): boolean {
  return redis !== null;
}
