import { mergeTransformOptions } from '@workspace/storage/media';

import { mediaClient } from '../lib/media';

/**
 * Spotlight image data
 * Images are served from CDN with Cloudflare Image Transforms
 */
export const SPOTLIGHT_IMAGE = {
  src: mediaClient.getSpotlightMediaUrl('spotlight/spotlight.webp', {
    transform: mergeTransformOptions('general', { width: 1920 }),
  }),
  alt: 'AI handling customer support calls',
};
