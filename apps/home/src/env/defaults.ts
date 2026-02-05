/**
 * Centralized default values for home/marketing environment configuration
 * All defaults are defined here to eliminate sprawl and ensure consistency
 */

// =============================================================================
// Development URLs
// =============================================================================

export const DEV_URLS = {
  HOME: 'https://home-dev.userplane.io',
  DASH: 'https://dash-dev.userplane.io',
  CDN: 'https://cdn-dev.userplane.io',
  ASSETS: 'https://assets-dev.userplane.io',
} as const;

// =============================================================================
// Storage/Media Defaults
// =============================================================================

export const STORAGE = {
  IMAGE_ZONE: 'userplane.io',
} as const;
