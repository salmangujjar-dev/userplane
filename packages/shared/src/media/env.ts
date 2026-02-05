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
  /** CDN prefix path */
  cdnPrefix: string;
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
 * - CDN_DOMAIN: CDN base URL (default: https://cdn.userplane.io)
 * - R2_CDN_PREFIX: CDN prefix path (default: media)
 *
 * @returns MediaEnvConfig with resolved values
 */
export function loadMediaEnvConfig(): MediaEnvConfig {
  const cdnBaseUrl = getEnvVar('CDN_DOMAIN') || MEDIA_DEFAULTS.CDN_BASE_URL;
  const cdnPrefix = getEnvVar('R2_CDN_PREFIX') || MEDIA_DEFAULTS.CDN_PREFIX;

  return {
    cdnBaseUrl,
    cdnPrefix,
    cdnUrl: `${cdnBaseUrl}/${cdnPrefix}`,
  };
}

/**
 * Global media environment configuration instance
 */
export const mediaEnv = loadMediaEnvConfig();
