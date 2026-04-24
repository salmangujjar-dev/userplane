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
  HOST: 'https://i.userplane.io',
} as const;

// =============================================================================
// Docs Defaults
// =============================================================================

export { DOCS_URL } from '@userplane/contract';

// =============================================================================
// Integration Marketplace Defaults
// =============================================================================

export const CHROME_EXTENSION_MARKETPLACE = {
  APP_URL:
    'https://chromewebstore.google.com/detail/request-screen-recording/bgmbeifpcfepegcjhjdbocjbecpfmakm',
} as const;

export const INTEGRATION_MARKETPLACE = {
  ZENDESK: {
    APP_URL:
      'https://www.zendesk.com/marketplace/apps/support/1229987/screen-recording-by-userplane/',
    LIVE: true,
  },
  DISCORD: {
    APP_URL: CHROME_EXTENSION_MARKETPLACE.APP_URL,
    LIVE: true,
  },
  HELPSCOUT: {
    APP_URL: CHROME_EXTENSION_MARKETPLACE.APP_URL,
    LIVE: true,
  },
  PYLON: {
    APP_URL: CHROME_EXTENSION_MARKETPLACE.APP_URL,
    LIVE: true,
  },
  PLAIN: {
    APP_URL: CHROME_EXTENSION_MARKETPLACE.APP_URL,
    LIVE: true,
  },
  HUBSPOT: {
    APP_URL: CHROME_EXTENSION_MARKETPLACE.APP_URL,
    LIVE: true,
  },
} as const;
