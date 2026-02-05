/**
 * Redis client initialization
 *
 * Creates and exports Redis client, cache service, and rate limiter instances.
 * Gracefully handles missing configuration by returning null/disabled instances.
 */

import { CacheService, createRedisClient, RateLimiter, type RedisConfig } from '@workspace/cache';
import { createAppLogger } from '@workspace/logger';

import { env } from '@/api/env';

const logger = createAppLogger('redis');

/**
 * Get Redis configuration from environment
 */
function getRedisConfig(): RedisConfig | null {
  if (!env.redis.url || !env.redis.token) {
    logger.info('Redis not configured - caching and rate limiting disabled');
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
  logger.info(
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
