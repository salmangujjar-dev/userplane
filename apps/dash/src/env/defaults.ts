/**
 * Centralized default values for dashboard environment configuration
 * All defaults are defined here to eliminate sprawl and ensure consistency
 */

// =============================================================================
// Development URLs
// =============================================================================

export const DEV_URLS = {
  API: 'https://api-dev.userplane.io',
  DASH: 'https://dash-dev.userplane.io',
  HOME: 'https://home-dev.userplane.io',
  RECORDER: 'https://recorder-dev.userplane.io',
  CDN: 'https://cdn-dev.userplane.io',
  ASSETS: 'https://assets-dev.userplane.io',
} as const;

// =============================================================================
// Auth Defaults
// =============================================================================

export const AUTH = {
  COOKIE_PREFIX: 'userplane',
} as const;

// =============================================================================
// Storage/Media Defaults
// =============================================================================

export const STORAGE = {
  IMAGE_ZONE: 'userplane.io',
} as const;

// =============================================================================
// Sentry Defaults
// =============================================================================

export const SENTRY = {
  /** Production traces sample rate */
  TRACES_SAMPLE_RATE_PROD: 0.1,
  /** Development traces sample rate */
  TRACES_SAMPLE_RATE_DEV: 1.0,
  /** Session replay sample rate */
  REPLAYS_SESSION_SAMPLE_RATE: 0.1,
  /** Error replay sample rate */
  REPLAYS_ERROR_SAMPLE_RATE: 1.0,
} as const;
