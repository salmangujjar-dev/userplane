/**
 * Query key factory for API key queries
 *
 * Structure:
 * - all: Base key for all API key queries (singleton resource per user)
 */
export const apiKeyKeys = {
  all: ['api-key'] as const,
} as const;

export type ApiKeyKeys = typeof apiKeyKeys;
