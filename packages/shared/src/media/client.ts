/**
 * Media Client
 * Client for accessing CDN media assets with category-specific methods.
 * All types are derived from the auto-generated manifest for compile-time safety.
 */

import { ASSET_MANIFEST, type AssetKey } from './manifest.generated';
import type {
  AuthAssetKey,
  BrandAssetKey,
  IconAssetKey,
  IntegrationAssetKey,
  IntercomCanvasAssetKey,
  TileAssetKey,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/** Default CDN domain */
export const DEFAULT_CDN_DOMAIN = 'https://cdn.userplane.io';

/** Default CDN prefix for media assets */
export const DEFAULT_CDN_PREFIX = 'media';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for MediaClient
 */
export interface MediaClientConfig {
  /** CDN domain (e.g., 'https://cdn.userplane.io') */
  cdnDomain: string;
}

// =============================================================================
// MediaClient
// =============================================================================

/**
 * Client for accessing CDN media assets
 *
 * @example
 * ```typescript
 * const client = createMediaClient({ cdnDomain: 'https://cdn.userplane.io' });
 * const logoUrl = client.getBrandMediaUrl('brand/logo-dark.svg');
 * const tileUrl = client.getTileMediaUrl('tiles/bubble.png');
 * ```
 */
export class MediaClient {
  private readonly cdnDomain: string;

  constructor(config: MediaClientConfig) {
    this.cdnDomain = config.cdnDomain.replace(/\/$/, '');
  }

  /**
   * Get CDN URL for any asset by its key
   * @param key - Asset key (e.g., 'brand/logo-dark.svg')
   * @returns Full CDN URL with content hash
   * @throws Error if asset key is not found in manifest
   */
  getMediaUrl(key: AssetKey): string {
    const hashedPath = ASSET_MANIFEST[key];
    if (!hashedPath) {
      throw new Error(`Unknown asset: ${key}`);
    }
    return `${this.cdnDomain}/${hashedPath}`;
  }

  /** Get CDN URL for an integration asset */
  getIntegrationMediaUrl(key: IntegrationAssetKey): string {
    return this.getMediaUrl(key);
  }

  /** Get CDN URL for a brand asset */
  getBrandMediaUrl(key: BrandAssetKey): string {
    return this.getMediaUrl(key);
  }

  /** Get CDN URL for a tile asset */
  getTileMediaUrl(key: TileAssetKey): string {
    return this.getMediaUrl(key);
  }

  /** Get CDN URL for an auth asset */
  getAuthMediaUrl(key: AuthAssetKey): string {
    return this.getMediaUrl(key);
  }

  /** Get CDN URL for an icon asset */
  getIconMediaUrl(key: IconAssetKey): string {
    return this.getMediaUrl(key);
  }

  /** Get CDN URL for an intercom canvas asset */
  getIntercomCanvasMediaUrl(key: IntercomCanvasAssetKey): string {
    return this.getMediaUrl(key);
  }
}

/**
 * Create a new MediaClient instance
 */
export function createMediaClient(config: MediaClientConfig): MediaClient {
  return new MediaClient(config);
}
