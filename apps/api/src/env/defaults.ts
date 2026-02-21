/**
 * Centralized default values for environment configuration
 * All defaults are defined here to eliminate sprawl and ensure consistency
 */

import { DEFAULT_TRIAL_PERIOD_DAYS } from '@workspace/contract';
import { SUPPORT_EMAIL as SHARED_SUPPORT_EMAIL } from '@workspace/shared';

// =============================================================================
// Time Constants (in seconds)
// =============================================================================

export const TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
} as const;

// =============================================================================
// Server Defaults
// =============================================================================

export const SERVER = {
  PORT: 3001,
  HOST: '0.0.0.0',
  NODE_ENV: 'development',
} as const;

// =============================================================================
// Development URLs
// These are used when env vars are not set (development environment)
// =============================================================================

export const DEV_URLS = {
  API: 'https://api-dev.userplane.io',
  DASH: 'https://dash-dev.userplane.io',
  HOME: 'https://home-dev.userplane.io',
  RECORDER: 'https://recorder-dev.userplane.io',
  DOCS: 'https://home-dev.userplane.io/help',
  CALENDAR: 'https://cal.com/userplane/intro',
} as const;

// =============================================================================
// Development Secrets
// These MUST be overridden in production - used to detect misconfiguration
// =============================================================================

export const DEV_SECRETS = {
  AUTH: 'dev-auth-secret-change-in-production',
  INVITE: 'dev-invite-secret-change-in-production',
  SESSION: 'dev-session-secret-change-in-production',
  UPLOAD: 'dev-upload-secret-change-in-production',
  RECORDER: 'dev-recorder-secret-change-in-production',
  DOMAIN_VERIFICATION: 'dev-domain-verification-secret-change-in-production',
} as const;

// =============================================================================
// Auth Defaults
// =============================================================================

export const AUTH = {
  JWT_ISSUER: 'userplane',
  COOKIE_PREFIX: 'userplane',
  GOOGLE_REDIRECT_PATH: '/api/auth/callback/google',
  INTERCOM_REDIRECT_PATH: '/callback/intercom',
} as const;

// =============================================================================
// CORS Defaults
// =============================================================================

export const CORS = {
  ORIGINS: [DEV_URLS.DASH, DEV_URLS.HOME, DEV_URLS.RECORDER],
  CREDENTIALS: true,
  MAX_AGE: TIME.DAY, // 86400 seconds
} as const;

// =============================================================================
// Token Expiry Defaults (in seconds)
// =============================================================================

export const TOKEN_EXPIRY = {
  /** Invite token: 30 days */
  INVITE: 30 * TIME.DAY,
  /** Domain verification: 5 minutes */
  DOMAIN_VERIFICATION: 5 * TIME.MINUTE,
  /** Access request: 7 days */
  ACCESS_REQUEST: 7 * TIME.DAY,
  /** Workspace create invite: 90 days */
  WORKSPACE_CREATE_INVITE: 90 * TIME.DAY,
  /** Recording token: 180 days */
  RECORDING: 180 * TIME.DAY,
} as const;

// =============================================================================
// Session Defaults (in seconds)
// =============================================================================

export const SESSION = {
  /** Session token expiry: 180 minutes */
  TOKEN_EXPIRY: 180 * TIME.MINUTE,
  /** Upload token expiry: 120 minutes */
  UPLOAD_TOKEN_EXPIRY: 120 * TIME.MINUTE,
  /** Presigned URL expiry: 90 minutes */
  PRESIGNED_URL_EXPIRY: 90 * TIME.MINUTE,
} as const;

// =============================================================================
// Email Defaults
// =============================================================================

export const EMAIL = {
  PROVIDER: 'localhost' as const,
  INBOXES: {
    ONBOARDING: 'hey@mail.userplane.io',
    NOTIFICATION: 'hey@mail.userplane.io',
    BILLING: 'hey@mail.userplane.io',
    INVITE: 'hey@mail.userplane.io',
    AUTH: 'hey@mail.userplane.io',
  },
} as const;

// =============================================================================
// Support Defaults
// =============================================================================

export const SUPPORT = {
  /** Uses shared constant, can be overridden via SUPPORT_EMAIL env var */
  EMAIL: SHARED_SUPPORT_EMAIL,
} as const;

// =============================================================================
// Rate Limit Defaults
// =============================================================================

export const RATE_LIMIT = {
  /** Window in milliseconds: 1 minute */
  WINDOW_MS: 60000,
  /** Max requests per window */
  MAX_REQUESTS: 100,
  /** Rate limiting enabled by default */
  ENABLED: true,
} as const;

// =============================================================================
// Cache Defaults
// =============================================================================

export const CACHE = {
  ENABLED: true,
} as const;

// =============================================================================
// Inngest (Background Jobs) Defaults
// =============================================================================

export const INNGEST = {
  /** Workspace sweep lookback: 7 days */
  WORKSPACE_SWEEP_LOOKBACK_DAYS: 7,
  /** Project sweep lookback: 3 days */
  PROJECT_SWEEP_LOOKBACK_DAYS: 3,
  /** Recording sweep lookback: 3 days */
  RECORDING_SWEEP_LOOKBACK_DAYS: 3,
  /** Daily at midnight UTC */
  CRON_SCHEDULE: '0 0 * * *',
  /** Workspace restoration window: 2 days */
  WORKSPACE_RESTORATION_WINDOW_DAYS: 2,
  /** Project restoration window: 2 days */
  PROJECT_RESTORATION_WINDOW_DAYS: 2,
  /** Expired recording sweep: daily at 2 AM UTC */
  EXPIRED_RECORDING_SWEEP_CRON_SCHEDULE: '0 2 * * *',
} as const;

// =============================================================================
// Restoration Defaults
// =============================================================================

export const RESTORATION = {
  /** Full restoration within 3 days */
  GRACE_PERIOD_DAYS: 3,
  /** Partial restoration until 30 days */
  MAX_WINDOW_DAYS: 30,
} as const;

// =============================================================================
// Storage/Media Defaults
// =============================================================================

export const STORAGE = {
  /** Default Cloudflare image zone */
  IMAGE_ZONE: 'userplane.io',
} as const;

// =============================================================================
// PostHog Defaults
// =============================================================================

export const POSTHOG = {
  HOST: 'https://us.i.posthog.com',
} as const;

// =============================================================================
// Billing Defaults
// =============================================================================

export const BILLING = {
  /** Default trial period in days for paid plan checkouts */
  TRIAL_PERIOD_DAYS: DEFAULT_TRIAL_PERIOD_DAYS,
} as const;

// =============================================================================
// Payments Defaults
// =============================================================================

export const PAYMENTS = {
  /** Default to test mode */
  ENVIRONMENT: 'test_mode' as const,
} as const;

// =============================================================================
// Helper to check if a secret is a development secret
// =============================================================================

export function isDevSecret(secret: string): boolean {
  return Object.values(DEV_SECRETS).includes(
    secret as (typeof DEV_SECRETS)[keyof typeof DEV_SECRETS]
  );
}

// =============================================================================
// Helper to get all dev secret values (for validation messages)
// =============================================================================

export function getDevSecretNames(): Record<string, string> {
  return {
    [DEV_SECRETS.AUTH]: 'BETTER_AUTH_SECRET',
    [DEV_SECRETS.INVITE]: 'INVITE_TOKEN_SECRET',
    [DEV_SECRETS.SESSION]: 'SESSION_TOKEN_SECRET',
    [DEV_SECRETS.UPLOAD]: 'UPLOAD_TOKEN_SECRET',
    [DEV_SECRETS.RECORDER]: 'RECORDER_TOKEN_SECRET',
    [DEV_SECRETS.DOMAIN_VERIFICATION]: 'DOMAIN_VERIFICATION_TOKEN_SECRET',
  };
}
