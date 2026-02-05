/**
 * Cloudflare Image Transform
 * Types and profiles for Cloudflare Image Transformations via URL.
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Cloudflare Image Transform options
 * Maps to URL parameters: /cdn-cgi/image/OPTIONS/SOURCE
 */
export interface TransformOptions {
  /** Image quality (1-100). Default: 85 */
  quality?: number;
  /** How image fits within dimensions */
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad';
  /** Focus point for cropping */
  gravity?: 'auto' | 'face' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  /** Output format. 'auto' serves WebP/AVIF based on browser support */
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  /** Output width in pixels */
  width?: number;
  /** Output height in pixels */
  height?: number;
  /** Device pixel ratio multiplier (1-3) */
  dpr?: number;
  /** Sharpening strength (0-10). Recommended: 1 for downscaled images */
  sharpen?: number;
  /** EXIF metadata handling */
  metadata?: 'none' | 'keep' | 'copyright';
}

/**
 * Profile name for predefined transform configurations
 */
export type TransformProfile = keyof typeof TRANSFORM_PROFILES;

// =============================================================================
// Profiles
// =============================================================================

/**
 * Predefined transform profiles optimized for different content types
 *
 * avatar: User avatars and workspace logos - face detection, high DPR
 * icon: Integration logos, auth icons - crisp edges, no face detection
 * feature: Screenshots and feature images - high DPR, sharpened for text
 * general: Hero images, tiles, decorative - balanced quality
 * brand: Brand logos - high quality, often SVGs
 */
export const TRANSFORM_PROFILES = {
  avatar: {
    quality: 85,
    fit: 'cover',
    gravity: 'face',
    format: 'auto',
    dpr: 2,
    metadata: 'none',
  },
  icon: {
    quality: 85,
    fit: 'contain',
    format: 'auto',
    sharpen: 1,
    metadata: 'none',
  },
  feature: {
    quality: 85,
    fit: 'scale-down',
    format: 'auto',
    dpr: 2,
    sharpen: 1,
    metadata: 'none',
  },
  general: {
    quality: 85,
    fit: 'scale-down',
    format: 'auto',
    metadata: 'none',
  },
  brand: {
    quality: 90,
    fit: 'contain',
    format: 'auto',
    metadata: 'none',
  },
} as const satisfies Record<string, TransformOptions>;

// =============================================================================
// URL Builder
// =============================================================================

/**
 * Default Cloudflare zone for image transforms
 */
export const DEFAULT_IMAGE_ZONE = 'userplane.io';

/**
 * Build Cloudflare Image Transform URL
 *
 * @param imageZone - Cloudflare zone (e.g., 'userplane.io')
 * @param sourceUrl - Original image URL
 * @param options - Transform options or profile name
 * @returns Transformed image URL
 *
 * @example
 * ```typescript
 * // Using options directly
 * buildTransformUrl('userplane.io', 'https://cdn.userplane.io/avatar.png', { width: 100, quality: 85 })
 * // Returns: https://userplane.io/cdn-cgi/image/width=100,quality=85/https://cdn.userplane.io/avatar.png
 *
 * // Using a profile
 * buildTransformUrl('userplane.io', 'https://cdn.userplane.io/avatar.png', 'avatar')
 * // Returns: https://userplane.io/cdn-cgi/image/quality=85,fit=cover,gravity=face,format=auto,dpr=2,metadata=none/https://cdn.userplane.io/avatar.png
 * ```
 */
export function buildTransformUrl(
  imageZone: string,
  sourceUrl: string,
  options: TransformOptions | TransformProfile
): string {
  // Resolve profile name to options
  const transformOptions: TransformOptions =
    typeof options === 'string' ? TRANSFORM_PROFILES[options] : options;

  // Build options string
  const params: string[] = [];

  if (transformOptions.width !== undefined) {
    params.push(`width=${transformOptions.width}`);
  }
  if (transformOptions.height !== undefined) {
    params.push(`height=${transformOptions.height}`);
  }
  if (transformOptions.quality !== undefined) {
    params.push(`quality=${transformOptions.quality}`);
  }
  if (transformOptions.fit !== undefined) {
    params.push(`fit=${transformOptions.fit}`);
  }
  if (transformOptions.gravity !== undefined) {
    params.push(`gravity=${transformOptions.gravity}`);
  }
  if (transformOptions.format !== undefined) {
    params.push(`format=${transformOptions.format}`);
  }
  if (transformOptions.dpr !== undefined) {
    params.push(`dpr=${transformOptions.dpr}`);
  }
  if (transformOptions.sharpen !== undefined) {
    params.push(`sharpen=${transformOptions.sharpen}`);
  }
  if (transformOptions.metadata !== undefined) {
    params.push(`metadata=${transformOptions.metadata}`);
  }

  const optionsString = params.join(',');

  return `https://${imageZone}/cdn-cgi/image/${optionsString}/${sourceUrl}`;
}

/**
 * Get profile options by name
 */
export function getTransformProfile(profile: TransformProfile): TransformOptions {
  return { ...TRANSFORM_PROFILES[profile] };
}

/**
 * Merge transform options with a profile as base
 */
export function mergeTransformOptions(
  profile: TransformProfile,
  overrides?: Partial<TransformOptions>
): TransformOptions {
  return { ...TRANSFORM_PROFILES[profile], ...overrides };
}
