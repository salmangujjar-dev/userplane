/**
 * Media client initialization
 * Creates media client using configuration from environment
 * Includes Cloudflare Image Transform support for on-the-fly optimization.
 */

import {
  createMediaClient,
  DEFAULT_CDN_DOMAIN,
  DEFAULT_IMAGE_ZONE,
  type MediaClient,
} from '@workspace/storage/media';

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
      imageZone: env.storage.imageZone || DEFAULT_IMAGE_ZONE,
      skipTransform: env.storage.skipTransform ?? false,
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
