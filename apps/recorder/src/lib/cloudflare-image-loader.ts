/**
 * Cloudflare Image Loader for Next.js
 *
 * Custom image loader that uses Cloudflare Image Transformations via URL.
 * Detects existing transforms from MediaClient and appends component params.
 * Cloudflare uses last-value-wins for duplicate params (component overrides baseline).
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

import type { ImageLoaderProps } from 'next/image';

const imageZone = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE || 'userplane.io';
const skipTransform = process.env.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM === 'true';

function addWidthParam(src: string, width: number): string {
  const hashIndex = src.indexOf('#');
  const base = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : src.slice(hashIndex);
  const separator = base.includes('?') ? '&' : '?';

  return `${base}${separator}w=${width}${hash}`;
}

export default function cloudflareLoader({ src, width }: ImageLoaderProps): string {
  // Blob previews and data URIs bypass CDN transforms and Next optimization
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // Local and skip-transform URLs still need width-aware output for Next.js
  if (src.startsWith('/')) {
    return addWidthParam(src, width);
  }

  if (skipTransform) {
    return addWidthParam(src, width);
  }

  const hasTransform = src.includes('/cdn-cgi/image/');

  if (hasTransform) {
    // Append width after existing options (MediaClient owns format, quality, metadata)
    return src.replace(/\/cdn-cgi\/image\/([^/]+)\//, `/cdn-cgi/image/$1,width=${width}/`);
  }

  // Fallback for non-MediaClient URLs: apply full baseline
  return `https://${imageZone}/cdn-cgi/image/width=${width},quality=85,format=auto,metadata=none/${src}`;
}
