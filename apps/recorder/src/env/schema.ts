/**
 * Environment configuration Zod schemas for recorder
 * Defines the shape and validation rules for all environment variables
 * Types are inferred from schemas to ensure consistency
 *
 * Note: This app uses Astro with import.meta.env (PUBLIC_ prefix)
 */
import { z } from 'zod';

import { DEV_URLS, SENTRY, STORAGE } from './defaults';

// =============================================================================
// Parse Utilities
// =============================================================================

/**
 * String with default value
 */
const stringWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue);

/**
 * URL with default value (validates the default and any provided value)
 */
const urlWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue)
    .pipe(z.string().url());

/**
 * Float with default value
 */
const floatWithDefault = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((val): number => {
      if (!val) return defaultValue;
      const parsed = Number.parseFloat(val);
      return isNaN(parsed) ? defaultValue : parsed;
    });

/**
 * Boolean with default value
 */
const booleanWithDefault = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((val): boolean => {
      if (!val) return defaultValue;
      return val.toLowerCase() === 'true';
    });

// =============================================================================
// Raw Environment Variable Schemas (for parsing import.meta.env)
// =============================================================================

/** App env vars schema */
export const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Astro uses MODE from --mode flag
  MODE: z.enum(['development', 'production']).default('development'),
});

/** API env vars schema */
export const apiEnvSchema = z.object({
  PUBLIC_API_URL: urlWithDefault(DEV_URLS.API),
});

/** Storage env vars schema */
export const storageEnvSchema = z.object({
  PUBLIC_CDN_DOMAIN: urlWithDefault(DEV_URLS.CDN),
  PUBLIC_ASSETS_DOMAIN: urlWithDefault(DEV_URLS.ASSETS),
  PUBLIC_CLOUDFLARE_IMAGE_ZONE: stringWithDefault(STORAGE.IMAGE_ZONE),
  PUBLIC_SKIP_IMAGE_TRANSFORM: booleanWithDefault(false),
});

/** Sentry env vars schema */
export const sentryEnvSchema = z.object({
  PUBLIC_SENTRY_DSN: z.string().url().optional(),
  PUBLIC_SENTRY_RELEASE: z.string().optional(),
  PUBLIC_SENTRY_TRACES_SAMPLE_RATE: floatWithDefault(SENTRY.TRACES_SAMPLE_RATE_DEV),
});

/** Combined raw environment variables schema */
export const rawEnvSchema = appEnvSchema
  .merge(apiEnvSchema)
  .merge(storageEnvSchema)
  .merge(sentryEnvSchema);

/** Raw parsed environment type */
export type RawEnvConfig = z.infer<typeof rawEnvSchema>;

// =============================================================================
// Structured Configuration Schemas (for application use)
// =============================================================================

/** API configuration schema */
export const apiConfigSchema = z.object({
  url: z.string().url(),
});

/** Storage configuration schema */
export const storageConfigSchema = z.object({
  cdnDomain: z.string().url(),
  assetsDomain: z.string().url(),
  imageZone: z.string(),
  skipTransform: z.boolean(),
});

/** Sentry configuration schema */
export const sentryConfigSchema = z.object({
  dsn: z.string().url().optional(),
  release: z.string().optional(),
  tracesSampleRate: z.number(),
});

/** Complete environment configuration schema */
export const envConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']),
  appEnv: z.enum(['development', 'production']),
  api: apiConfigSchema,
  storage: storageConfigSchema,
  sentry: sentryConfigSchema,
});

// =============================================================================
// Inferred Types (pinned to schemas)
// =============================================================================

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type SentryConfig = z.infer<typeof sentryConfigSchema>;
export type EnvConfig = z.infer<typeof envConfigSchema>;
