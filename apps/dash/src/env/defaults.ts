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
// PostHog Defaults
// =============================================================================

export const POSTHOG = {
  HOST: 'https://us.i.posthog.com',
} as const;
