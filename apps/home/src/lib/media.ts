/**
 * Media client for home app
 * Provides access to CDN media assets (logos, favicons, etc.)
 * Includes Cloudflare Image Transform support for on-the-fly optimization.
 */

import { createMediaClient } from '@workspace/storage/media';

import { env } from '@/env';

export const mediaClient = createMediaClient({
  cdnDomain: env.storage.cdnDomain,
  imageZone: env.storage.imageZone,
  skipTransform: env.storage.skipTransform,
});
