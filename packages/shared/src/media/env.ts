/**
 * Media environment configuration with type safety
 * Follows pattern from apps/api/src/env/index.ts
 */

import { MEDIA_DEFAULTS } from './defaults';

// =============================================================================
// Types
// =============================================================================

/**
 * Media environment configuration interface
 */
export interface MediaEnvConfig {
  /** CDN base URL (without prefix) */
  cdnBaseUrl: string;
  /** Assets prefix path */
  assetsPrefix: string;
  /** Full CDN URL (base + prefix) */
  cdnUrl: string;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Get environment variable in a cross-platform way
 * Works in Node.js, Bun, and browser environments
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

// =============================================================================
// Configuration Loading
// =============================================================================

/**
 * Load media environment configuration
 * Reads from environment variables with fallback to defaults
 *
 * Environment variables:
 * - MEDIA_CDN_BASE_URL: CDN base URL (default: https://cdn.userplane.io)
 * - MEDIA_ASSETS_PREFIX: Assets prefix path (default: media)
 *
 * @returns MediaEnvConfig with resolved values
 */
export function loadMediaEnvConfig(): MediaEnvConfig {
  const cdnBaseUrl = getEnvVar('MEDIA_CDN_BASE_URL') || MEDIA_DEFAULTS.CDN_BASE_URL;
  const assetsPrefix = getEnvVar('MEDIA_ASSETS_PREFIX') || MEDIA_DEFAULTS.ASSETS_PREFIX;

  return {
    cdnBaseUrl,
    assetsPrefix,
    cdnUrl: `${cdnBaseUrl}/${assetsPrefix}`,
  };
}

/**
 * Global media environment configuration instance
 */
export const mediaEnv = loadMediaEnvConfig();
