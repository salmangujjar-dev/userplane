/**
 * Media Client
 * Client for accessing CDN media assets with category-specific methods.
 * All types are derived from the auto-generated manifest for compile-time safety.
 *
 * Supports Cloudflare Image Transformations via URL for on-the-fly optimization.
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

import { ASSET_MANIFEST, type AssetKey } from './manifest.generated';
import {
  buildTransformUrl,
  DEFAULT_IMAGE_ZONE,
  type TransformOptions,
  type TransformProfile,
} from './transform';
import type {
  AuthAssetKey,
  BrandAssetKey,
  FeatureAssetKey,
  HeroAssetKey,
  IconAssetKey,
  IntegrationAssetKey,
  IntercomCanvasAssetKey,
  MicrositeAssetKey,
  PreviewAssetKey,
  SlackAssetKey,
  SpotlightAssetKey,
  TileAssetKey,
  ZendeskAssetKey,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/** Default CDN domain */
export const DEFAULT_CDN_DOMAIN = 'https://cdn.userplane.io';

/** Default CDN prefix for media assets */
export const DEFAULT_CDN_PREFIX = 'media';

/**
 * Default transform profiles for each asset category
 */
const CATEGORY_PROFILES: Record<string, TransformProfile> = {
  integrations: 'icon',
  brand: 'brand',
  tiles: 'general',
  auth: 'icon',
  icons: 'icon',
  'intercom-canvas': 'general',
  slack: 'general',
  features: 'feature',
  hero: 'general',
  preview: 'general',
  spotlight: 'general',
  microsites: 'feature',
};

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for MediaClient
 */
export interface MediaClientConfig {
  /** CDN domain (e.g., 'https://cdn.userplane.io') */
  cdnDomain: string;
  /** Cloudflare zone for image transforms (e.g., 'userplane.io'). Defaults to DEFAULT_IMAGE_ZONE */
  imageZone?: string;
  /** Skip image transforms (serve original URLs). Set via SKIP_IMAGE_TRANSFORM env var */
  skipTransform?: boolean;
}

/**
 * Options for getting a media URL with transforms
 */
export interface GetMediaUrlOptions {
  /** Custom transform options (overrides category default) */
  transform?: TransformOptions | TransformProfile;
  /** Skip transforms for this request */
  skipTransform?: boolean;
}

// =============================================================================
// MediaClient
// =============================================================================

/**
 * Client for accessing CDN media assets with Cloudflare Image Transforms
 *
 * @example
 * ```typescript
 * const client = createMediaClient({
 *   cdnDomain: 'https://cdn.userplane.io',
 *   imageZone: 'userplane.io'
 * });
 *
 * // Get URL with default category transform profile
 * const logoUrl = client.getBrandMediaUrl('brand/logo-dark.svg');
 *
 * // Get URL with custom transform options
 * const avatarUrl = client.getMediaUrl('auth/slack.png', {
 *   transform: { width: 48, height: 48 }
 * });
 *
 * // Skip transforms for a specific request
 * const rawUrl = client.getMediaUrl('tiles/bubble.png', { skipTransform: true });
 * ```
 */
export class MediaClient {
  private readonly cdnDomain: string;
  private readonly imageZone: string;
  private readonly skipTransform: boolean;

  constructor(config: MediaClientConfig) {
    this.cdnDomain = config.cdnDomain.replace(/\/$/, '');
    this.imageZone = config.imageZone ?? DEFAULT_IMAGE_ZONE;
    this.skipTransform = config.skipTransform ?? false;
  }

  /**
   * Get the raw CDN URL for an asset (no transforms)
   */
  private getRawUrl(key: AssetKey): string {
    const hashedPath = ASSET_MANIFEST[key];
    if (!hashedPath) {
      throw new Error(`Unknown asset: ${key}`);
    }
    return `${this.cdnDomain}/${hashedPath}`;
  }

  /**
   * Get the category from an asset key
   */
  private getCategory(key: AssetKey): string {
    // Asset keys are always in format 'category/filename', so split always returns at least one element
    const category = key.split('/')[0];
    return category ?? '';
  }

  /**
   * Get the default transform profile for a category
   */
  private getCategoryProfile(category: string): TransformProfile | undefined {
    return CATEGORY_PROFILES[category];
  }

  /**
   * Apply transforms to a URL based on options or category default
   */
  private applyTransforms(rawUrl: string, category: string, options?: GetMediaUrlOptions): string {
    // Skip transforms if globally disabled or per-request disabled
    if (this.skipTransform || options?.skipTransform) {
      return rawUrl;
    }

    // Use custom transform if provided, otherwise use category default
    const transform = options?.transform ?? this.getCategoryProfile(category);

    // No transform configured
    if (!transform) {
      return rawUrl;
    }

    return buildTransformUrl(this.imageZone, rawUrl, transform);
  }

  /**
   * Get CDN URL for any asset by its key
   * @param key - Asset key (e.g., 'brand/logo-dark.svg')
   * @param options - Transform options
   * @returns Full CDN URL with optional transforms
   * @throws Error if asset key is not found in manifest
   */
  getMediaUrl(key: AssetKey, options?: GetMediaUrlOptions): string {
    const rawUrl = this.getRawUrl(key);
    const category = this.getCategory(key);
    return this.applyTransforms(rawUrl, category, options);
  }

  /** Get CDN URL for an integration asset */
  getIntegrationMediaUrl(key: IntegrationAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a brand asset */
  getBrandMediaUrl(key: BrandAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a tile asset */
  getTileMediaUrl(key: TileAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for an auth asset */
  getAuthMediaUrl(key: AuthAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for an icon asset */
  getIconMediaUrl(key: IconAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for an intercom canvas asset */
  getIntercomCanvasMediaUrl(key: IntercomCanvasAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a zendesk app asset */
  getZendeskMediaUrl(key: ZendeskAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a slack canvas asset */
  getSlackMediaUrl(key: SlackAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a feature asset */
  getFeatureMediaUrl(key: FeatureAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a hero asset */
  getHeroMediaUrl(key: HeroAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a preview asset */
  getPreviewMediaUrl(key: PreviewAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a spotlight asset */
  getSpotlightMediaUrl(key: SpotlightAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }

  /** Get CDN URL for a microsite asset */
  getMicrositeMediaUrl(key: MicrositeAssetKey, options?: GetMediaUrlOptions): string {
    return this.getMediaUrl(key, options);
  }
}

/**
 * Create a new MediaClient instance
 */
export function createMediaClient(config: MediaClientConfig): MediaClient {
  return new MediaClient(config);
}
