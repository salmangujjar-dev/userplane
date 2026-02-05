/**
 * Cloudflare Image Service for Astro
 *
 * Custom external image service that uses Cloudflare Image Transformations via URL.
 * Detects existing transforms from MediaClient and appends component params.
 * Cloudflare uses last-value-wins for duplicate params (component overrides baseline).
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

import type { ExternalImageService, ImageTransform } from 'astro';

const imageZone = import.meta.env.PUBLIC_CLOUDFLARE_IMAGE_ZONE || 'userplane.io';
const skipTransform = import.meta.env.PUBLIC_SKIP_IMAGE_TRANSFORM === 'true';

/**
 * Build sizing params from Astro ImageTransform options
 * Only includes width/height - format, quality, metadata come from MediaClient profiles
 */
function buildSizeParams(options: ImageTransform): string {
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);

  return params.join(',');
}

/**
 * Build full baseline params for non-MediaClient URLs
 */
function buildBaselineParams(options: ImageTransform): string {
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  params.push(`quality=${options.quality || 85}`);

  if (options.fit) {
    const fitMap: Record<string, string> = {
      contain: 'contain',
      cover: 'cover',
      fill: 'cover',
      inside: 'scale-down',
      outside: 'cover',
    };
    params.push(`fit=${fitMap[options.fit] || 'scale-down'}`);
  }

  params.push('format=auto');
  params.push('metadata=none');

  return params.join(',');
}

const cloudflareImageService: ExternalImageService = {
  validateOptions(options) {
    return options;
  },

  getURL(options) {
    const src = typeof options.src === 'string' ? options.src : options.src.src;

    if (skipTransform) {
      return src;
    }

    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      return src;
    }

    const hasTransform = src.includes('/cdn-cgi/image/');

    if (hasTransform) {
      // Append sizing after existing options (MediaClient owns format, quality, metadata)
      const sizeParams = buildSizeParams(options);
      if (sizeParams) {
        return src.replace(/\/cdn-cgi\/image\/([^/]+)\//, `/cdn-cgi/image/$1,${sizeParams}/`);
      }
      return src;
    }

    // Fallback for non-MediaClient URLs: apply full baseline
    const baselineParams = buildBaselineParams(options);
    return `https://${imageZone}/cdn-cgi/image/${baselineParams}/${src}`;
  },

  getHTMLAttributes(options) {
    const { width, height, loading, decoding, ...rest } = options;
    const htmlAttributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rest)) {
      if (!['src', 'format', 'quality', 'fit'].includes(key)) {
        htmlAttributes[key] = value;
      }
    }

    return {
      ...htmlAttributes,
      width,
      height,
      loading: loading ?? 'lazy',
      decoding: decoding ?? 'async',
    };
  },
};

export default cloudflareImageService;
