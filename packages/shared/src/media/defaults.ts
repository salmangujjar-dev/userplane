/**
 * Default values for media configuration
 * Centralized defaults for CDN and asset configuration
 */

/**
 * Default configuration values for media assets
 */
export const MEDIA_DEFAULTS = {
  /** Default CDN base URL (without prefix) */
  CDN_BASE_URL: 'https://cdn.userplane.io',
  /** Default assets prefix path */
  ASSETS_PREFIX: 'media',
} as const;

export type MediaDefaults = typeof MEDIA_DEFAULTS;
