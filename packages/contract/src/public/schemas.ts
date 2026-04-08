/**
 * Public API schemas
 * Reuses existing schemas from the internal API where possible.
 * All public API endpoints use workspaceId in path params.
 */

import { z } from 'zod';

/**
 * API key limits
 */
export const API_KEY_LIMITS = {
  /** Maximum number of API keys a single user can have */
  MAX_KEYS_PER_USER: 3,
  /** Maximum key expiration in seconds (90 days) */
  MAX_EXPIRES_IN_SECONDS: 90 * 24 * 60 * 60, // 7,776,000
} as const;

/**
 * Default rate limits for Unkey identities.
 * Applied per-user (shared across all keys for that user).
 * Override via UNKEY_RATE_LIMIT_PER_MINUTE / UNKEY_RATE_LIMIT_PER_DAY env vars.
 */
export const API_KEY_RATE_LIMIT_DEFAULTS = {
  /** Requests per minute */
  PER_MINUTE: 120,
  /** Requests per day */
  PER_DAY: 10_000,
} as const;

/**
 * API key expiration presets (in seconds) for UI dropdowns
 */
export const API_KEY_EXPIRATION_OPTIONS = [
  { label: 'No expiration', value: 0 },
  { label: '7 days', value: 7 * 24 * 60 * 60 },
  { label: '30 days', value: 30 * 24 * 60 * 60 },
  { label: '60 days', value: 60 * 24 * 60 * 60 },
  { label: '90 days', value: 90 * 24 * 60 * 60 },
] as const;

// =============================================================================
// API key management schemas
// =============================================================================

export const CreateApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    expiresIn: z.number().int().positive().max(API_KEY_LIMITS.MAX_EXPIRES_IN_SECONDS).optional(),
  }),
});

export const ApiKeyByIdSchema = z.object({
  params: z.object({
    keyId: z.string(),
  }),
});

export const ApiKeyDataSchema = z.object({
  keyId: z.string(),
  maskedKey: z.string(),
  name: z.string().nullable(),
  createdAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  enabled: z.boolean(),
});

export const ApiKeyListDataSchema = z.object({
  keys: z.array(ApiKeyDataSchema),
});

export const ApiKeyCreateDataSchema = z.object({
  key: z.string(),
  keyId: z.string(),
  expiresAt: z.string().nullable(),
});

export const ApiKeyDeleteDataSchema = z.object({
  revoked: z.literal(true),
});

export const ApiKeyRotateSchema = z.object({
  params: z.object({
    keyId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    expiresIn: z.number().int().positive().max(API_KEY_LIMITS.MAX_EXPIRES_IN_SECONDS).optional(),
  }),
});

// =============================================================================
// /me endpoint schemas
// =============================================================================

export const MeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const MeStatsSchema = z.object({
  workspaces: z.number().int().nonnegative(),
  recordings: z.number().int().nonnegative(),
  links: z.number().int().nonnegative(),
});

export const MeDataSchema = z.object({
  user: MeUserSchema,
  stats: MeStatsSchema,
});

// =============================================================================
// Type exports
// =============================================================================

export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type ApiKeyData = z.infer<typeof ApiKeyDataSchema>;
export type ApiKeyListData = z.infer<typeof ApiKeyListDataSchema>;
export type ApiKeyCreateData = z.infer<typeof ApiKeyCreateDataSchema>;
export type MeData = z.infer<typeof MeDataSchema>;
