/**
 * Environment configuration Zod schemas for dashboard
 * Defines the shape and validation rules for all environment variables
 * Types are inferred from schemas to ensure consistency
 */
import { z } from 'zod';

import { AUTH, DEV_URLS, POSTHOG, STORAGE } from './defaults';

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
// Raw Environment Variable Schemas (for parsing process.env)
// =============================================================================

/** App env vars schema */
export const appEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'production']).default('development'),
});

/** URL env vars schema */
export const urlEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: urlWithDefault(DEV_URLS.API),
  NEXT_PUBLIC_DASHBOARD_URL: urlWithDefault(DEV_URLS.DASH),
  NEXT_PUBLIC_HOME_URL: urlWithDefault(DEV_URLS.HOME),
  NEXT_PUBLIC_RECORDER_URL: urlWithDefault(DEV_URLS.RECORDER),
  NEXT_PUBLIC_CDN_DOMAIN: urlWithDefault(DEV_URLS.CDN),
  NEXT_PUBLIC_ASSETS_DOMAIN: urlWithDefault(DEV_URLS.ASSETS),
});

/** Auth env vars schema */
export const authEnvSchema = z.object({
  NEXT_PUBLIC_AUTH_COOKIE_PREFIX: stringWithDefault(AUTH.COOKIE_PREFIX),
});

/** Storage env vars schema */
export const storageEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE: stringWithDefault(STORAGE.IMAGE_ZONE),
  NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM: booleanWithDefault(false),
});

/** PostHog env vars schema */
export const posthogEnvSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: z
    .string()
    .optional()
    .transform((val): string | undefined => val || undefined),
  NEXT_PUBLIC_POSTHOG_HOST: stringWithDefault(POSTHOG.HOST),
  NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_SAMPLE_RATE: floatWithDefault(
    POSTHOG.SESSION_REPLAY_SAMPLE_RATE
  ),
  NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ERROR_SAMPLE_RATE: floatWithDefault(
    POSTHOG.SESSION_REPLAY_ERROR_SAMPLE_RATE
  ),
});

/** Combined raw environment variables schema */
export const rawEnvSchema = appEnvSchema
  .merge(urlEnvSchema)
  .merge(authEnvSchema)
  .merge(storageEnvSchema)
  .merge(posthogEnvSchema);

/** Raw parsed environment type */
export type RawEnvConfig = z.infer<typeof rawEnvSchema>;

// =============================================================================
// Structured Configuration Schemas (for application use)
// =============================================================================

/** API configuration schema */
export const apiConfigSchema = z.object({
  url: z.string().url(),
});

/** Dashboard configuration schema */
export const dashboardConfigSchema = z.object({
  url: z.string().url(),
});

/** Home configuration schema */
export const homeConfigSchema = z.object({
  url: z.string().url(),
});

/** Recorder configuration schema */
export const recorderConfigSchema = z.object({
  url: z.string().url(),
});

/** Auth configuration schema */
export const authConfigSchema = z.object({
  cookiePrefix: z.string(),
});

/** Storage configuration schema */
export const storageConfigSchema = z.object({
  cdnDomain: z.string().url(),
  assetsDomain: z.string().url(),
  imageZone: z.string(),
  skipTransform: z.boolean(),
});

/** PostHog configuration schema */
export const posthogConfigSchema = z.object({
  apiKey: z.string().optional(),
  host: z.string().url(),
  sessionReplaySampleRate: z.number(),
  sessionReplayErrorSampleRate: z.number(),
});

/** Complete environment configuration schema */
export const envConfigSchema = z.object({
  appEnv: z.enum(['development', 'production']),
  useSecureCookies: z.boolean(),
  api: apiConfigSchema,
  dashboard: dashboardConfigSchema,
  home: homeConfigSchema,
  recorder: recorderConfigSchema,
  auth: authConfigSchema,
  storage: storageConfigSchema,
  posthog: posthogConfigSchema,
});

// =============================================================================
// Inferred Types (pinned to schemas)
// =============================================================================

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type HomeConfig = z.infer<typeof homeConfigSchema>;
export type RecorderConfig = z.infer<typeof recorderConfigSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type PostHogConfig = z.infer<typeof posthogConfigSchema>;
export type EnvConfig = z.infer<typeof envConfigSchema>;
