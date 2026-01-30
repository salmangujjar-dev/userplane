/**
 * Query key factory for auth/session-related queries
 */
export const authKeys = {
  all: ['auth'] as const,

  // Session
  session: () => [...authKeys.all, 'session'] as const,
} as const;

// Type helpers for query key inference
export type AuthKeys = typeof authKeys;
