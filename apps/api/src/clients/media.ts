/**
 * Media client initialization
 * Creates media client using configuration from environment
 */

import { createMediaClient, DEFAULT_CDN_DOMAIN, type MediaClient } from '@workspace/shared/media';

import { env } from '@/api/env';

// Singleton instance
let mediaClient: MediaClient | null = null;

/**
 * Get the media client instance
 * Creates client on first call with CDN domain from environment
 */
export function getMediaClient(): MediaClient {
  if (!mediaClient) {
    mediaClient = createMediaClient({
      cdnDomain: env.storage.cdnDomain || DEFAULT_CDN_DOMAIN,
    });
  }
  return mediaClient;
}

/**
 * Reset the media client (useful for testing)
 */
export function resetMediaClient(): void {
  mediaClient = null;
}
