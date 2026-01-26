/**
 * Upstash Redis client singleton
 *
 * Creates and exports a Redis client for caching and rate limiting.
 * Gracefully handles missing configuration by returning null.
 */

import { Redis } from '@upstash/redis';

export interface RedisConfig {
  url: string;
  token: string;
}

let redisClient: Redis | null = null;

/**
 * Create Redis client from configuration
 * Returns null if configuration is missing or invalid
 */
export function createRedisClient(config: RedisConfig | null): Redis | null {
  if (!config?.url || !config?.token) {
    return null;
  }

  try {
    redisClient = new Redis({
      url: config.url,
      token: config.token,
    });
    return redisClient;
  } catch (error) {
    console.warn('[Cache] Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Get the current Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null;
}

export { Redis };
