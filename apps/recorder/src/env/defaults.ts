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
// PostHog Defaults
// =============================================================================

export const POSTHOG = {
  HOST: 'https://i.userplane.io',
} as const;
