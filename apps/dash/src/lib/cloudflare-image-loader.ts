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

export default function cloudflareLoader({ src, width }: ImageLoaderProps): string {
  if (skipTransform) {
    return src;
  }

  const hasTransform = src.includes('/cdn-cgi/image/');

  if (hasTransform) {
    // Append width after existing options (MediaClient owns format, quality, metadata)
    return src.replace(/\/cdn-cgi\/image\/([^/]+)\//, `/cdn-cgi/image/$1,width=${width}/`);
  }

  // Fallback for non-MediaClient URLs: apply full baseline
  return `https://${imageZone}/cdn-cgi/image/width=${width},quality=85,format=auto,metadata=none/${src}`;
}
