/**
 * Query key factory for account-related queries
 *
 * Structure:
 * - all: Base key for all account queries (singleton resource)
 *
 * Why this structure:
 * - Account is a singleton resource (current user)
 * - Simple structure with no variations needed
 * - Can be extended if account has sub-resources in the future
 */
export const accountKeys = {
  all: ['account'] as const,
} as const;

// Type helpers for query key inference
export type AccountKeys = typeof accountKeys;
