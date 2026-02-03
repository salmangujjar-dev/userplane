/**
 * Media Store Configuration
 * CDN URL configuration for serving media assets
 *
 * This module re-exports from defaults.ts and env.ts for backwards compatibility.
 * For new code, prefer importing from './defaults' and './env' directly.
 */

// Re-export defaults
export { MEDIA_DEFAULTS, type MediaDefaults } from './defaults';

// Re-export env config
export { loadMediaEnvConfig, mediaEnv, type MediaEnvConfig } from './env';

// Import for backwards-compatible exports
import { mediaEnv } from './env';

/**
 * CDN base URL (without prefix)
 * Set via MEDIA_CDN_BASE_URL environment variable
 *
 * @deprecated Use `mediaEnv.cdnBaseUrl` instead
 */
export const MEDIA_CDN_BASE_URL = mediaEnv.cdnBaseUrl;

/**
 * Assets prefix path
 * Set via MEDIA_ASSETS_PREFIX environment variable
 * Should match R2_ASSETS_PREFIX used during upload
 *
 * @deprecated Use `mediaEnv.assetsPrefix` instead
 */
export const MEDIA_ASSETS_PREFIX = mediaEnv.assetsPrefix;

/**
 * Full CDN URL for media assets (base + prefix)
 * Constructed from MEDIA_CDN_BASE_URL and MEDIA_ASSETS_PREFIX
 *
 * @deprecated Use `mediaEnv.cdnUrl` instead
 */
export const MEDIA_CDN_URL = mediaEnv.cdnUrl;
