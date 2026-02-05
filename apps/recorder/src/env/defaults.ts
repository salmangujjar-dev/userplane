/**
 * Centralized default values for recorder environment configuration
 * All defaults are defined here to eliminate sprawl and ensure consistency
 */

// =============================================================================
// Development URLs
// =============================================================================

export const DEV_URLS = {
  API: 'https://api-dev.userplane.io/api/v1',
  CDN: 'https://cdn-dev.userplane.io',
  ASSETS: 'https://assets-dev.userplane.io',
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
} as const;
