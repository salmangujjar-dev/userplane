import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../lib/media';

/**
 * Spotlight image responsive sources
 * Images are served from CDN with Cloudflare Image Transforms
 */
const SPOTLIGHT_SOURCES = {
  mobile: mediaClient.getSpotlightMediaUrl('spotlight/spotlight.webp', {
    transform: mergeTransformOptions('general', { width: 768 }),
  }),
  tablet: mediaClient.getSpotlightMediaUrl('spotlight/spotlight.webp', {
    transform: mergeTransformOptions('general', { width: 1280 }),
  }),
  desktop: mediaClient.getSpotlightMediaUrl('spotlight/spotlight.webp', {
    transform: mergeTransformOptions('general', { width: 1920 }),
  }),
};

export const SPOTLIGHT_IMAGE = {
  src: SPOTLIGHT_SOURCES.desktop,
  srcSet: `${SPOTLIGHT_SOURCES.mobile} 768w, ${SPOTLIGHT_SOURCES.tablet} 1280w, ${SPOTLIGHT_SOURCES.desktop} 1920w`,
  sizes: '100vw',
  alt: 'AI handling customer support calls',
};
