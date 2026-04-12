import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';

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
  width: 1920,
  height: 1080,
  alt: 'AI handling customer support calls',
};

const VIMEO_VIDEO_ID = '1181995697';

export const SPOTLIGHT_VIDEO = {
  src: `https://player.vimeo.com/video/${VIMEO_VIDEO_ID}?autoplay=1`,
  title: 'Introducing Userplane',
};
