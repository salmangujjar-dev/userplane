/**
 * Media Store Configuration
 * CDN URL configuration for serving media assets
 */

/**
 * Get environment variable in a cross-platform way
 */
function getEnvVar(name: string): string | undefined {
  // Check for globalThis.process (Node.js/Bun)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (g?.process?.env) {
    return g.process.env[name] as string | undefined;
  }
  return undefined;
}

/**
 * Default values for media configuration
 */
const DEFAULTS = {
  CDN_BASE_URL: 'https://cdn.userplane.io',
  ASSETS_PREFIX: 'media',
} as const;

/**
 * CDN base URL (without prefix)
 * Set via MEDIA_CDN_BASE_URL environment variable
 */
export const MEDIA_CDN_BASE_URL = getEnvVar('MEDIA_CDN_BASE_URL') || DEFAULTS.CDN_BASE_URL;

/**
 * Assets prefix path
 * Set via MEDIA_ASSETS_PREFIX environment variable
 * Should match R2_ASSETS_PREFIX used during upload
 */
export const MEDIA_ASSETS_PREFIX = getEnvVar('MEDIA_ASSETS_PREFIX') || DEFAULTS.ASSETS_PREFIX;

/**
 * Full CDN URL for media assets (base + prefix)
 * Constructed from MEDIA_CDN_BASE_URL and MEDIA_ASSETS_PREFIX
 */
export const MEDIA_CDN_URL = `${MEDIA_CDN_BASE_URL}/${MEDIA_ASSETS_PREFIX}`;
