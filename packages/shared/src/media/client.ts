/**
 * Media Client
 * Client for accessing CDN media assets with explicit configuration
 */

import { ASSET_MANIFEST, type AssetKey } from './manifest.generated';
import type {
  AuthProviderName,
  IconName,
  IntegrationName,
  IntercomCanvasImageName,
  ThemeVariant,
  TileName,
} from './types';

// =============================================================================
// Constants
// =============================================================================

/** Default CDN domain */
export const DEFAULT_CDN_DOMAIN = 'https://cdn.userplane.io';

/** Default CDN prefix for media assets */
export const DEFAULT_CDN_PREFIX = 'media';

/** All tile names */
const TILE_NAMES: readonly TileName[] = [
  'browsercursor',
  'bubble',
  'documentation',
  'fin',
  'intercom',
  'letterbox',
  'lighthouse',
  'magf',
  'meetview',
  'paperplane',
  'pointer',
  'ring',
] as const;

/** All integration names */
const INTEGRATION_NAMES: readonly IntegrationName[] = [
  'asana',
  'clickup',
  'crisp',
  'discord',
  'freshchat',
  'freshdesk',
  'front',
  'happyfox',
  'helpscout',
  'hiver',
  'hubspot',
  'intercom',
  'jira',
  'jiraservicedesk',
  'linear',
  'make',
  'n8n',
  'notion',
  'plain',
  'pylon',
  'salesforce',
  'sentry',
  'slack',
  'talkdesk',
  'zapier',
  'zendesk',
  'zoho',
] as const;

/** All auth provider names */
const AUTH_PROVIDER_NAMES: readonly AuthProviderName[] = [
  'crisp',
  'discord',
  'freshdesk',
  'happyfox',
  'helpscout',
  'hiver',
  'intercom',
  'jira',
  'linear',
  'pylon',
  'slack',
  'zendesk',
] as const;

/** All icon names */
const ICON_NAMES: readonly IconName[] = [
  'dino',
  'checkmark',
  'desktop',
  'monitor',
  'video',
] as const;

/** All intercom canvas image names */
const INTERCOM_CANVAS_IMAGE_NAMES: readonly IntercomCanvasImageName[] = [
  'logo',
  'openerRequestRecording',
  'openerViewRecordings',
  'successLinkCreated',
  'errorGeneric',
  'accessRequestedLock',
  'limitExceededUpgrade',
] as const;

/** Mapping from IntercomCanvasImageName to asset keys */
const INTERCOM_CANVAS_ASSET_KEYS: Record<IntercomCanvasImageName, string> = {
  logo: 'intercom-canvas/userplane-icon.png',
  openerRequestRecording: 'intercom-canvas/intercom/request-recording.png',
  openerViewRecordings: 'intercom-canvas/intercom/view-recordings.png',
  successLinkCreated: 'intercom-canvas/intercom/success.png',
  errorGeneric: 'intercom-canvas/intercom/error.png',
  accessRequestedLock: 'intercom-canvas/intercom/lock.png',
  limitExceededUpgrade: 'intercom-canvas/intercom/upgrade.png',
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
 * const logoUrl = client.brand.logo('dark');
 * const allTiles = client.tiles.all();
 * ```
 */
export class MediaClient {
  private readonly cdnDomain: string;

  constructor(config: MediaClientConfig) {
    // Remove trailing slash if present
    this.cdnDomain = config.cdnDomain.replace(/\/$/, '');
  }

  /**
   * Get CDN URL for an asset by its key
   * @param key - Asset key (e.g., 'brand/logo-dark.svg')
   * @returns Full CDN URL with content hash
   * @throws Error if asset key is not found in manifest
   */
  getUrl(key: AssetKey): string {
    const hashedPath = ASSET_MANIFEST[key];
    if (!hashedPath) {
      throw new Error(`Unknown asset: ${key}`);
    }
    // Manifest already includes prefix, so just combine domain + path
    return `${this.cdnDomain}/${hashedPath}`;
  }

  /**
   * Brand asset URL builders
   */
  readonly brand = {
    /**
     * Get logo URL for a theme variant
     * @param theme - 'dark' or 'light'
     */
    logo: (theme: ThemeVariant): string => {
      return this.getUrl(`brand/logo-${theme}.svg` as AssetKey);
    },

    /**
     * Get favicon URL
     */
    favicon: (): string => {
      return this.getUrl('brand/favicon.svg' as AssetKey);
    },
  };

  /**
   * Tile asset URL builders
   */
  readonly tiles = {
    /**
     * Get tile URL by name
     * @param name - Tile name
     */
    get: (name: TileName): string => {
      return this.getUrl(`tiles/${name}.png` as AssetKey);
    },

    /**
     * Get all tile URLs as a record
     */
    all: (): Record<TileName, string> => {
      const result = {} as Record<TileName, string>;
      for (const name of TILE_NAMES) {
        result[name] = this.getUrl(`tiles/${name}.png` as AssetKey);
      }
      return result;
    },
  };

  /**
   * Integration asset URL builders
   */
  readonly integrations = {
    /**
     * Get integration logo URL by name
     * @param name - Integration name
     */
    get: (name: IntegrationName): string => {
      return this.getUrl(`integrations/${name}.webp` as AssetKey);
    },

    /**
     * Get all integration logo URLs as a record
     */
    all: (): Record<IntegrationName, string> => {
      const result = {} as Record<IntegrationName, string>;
      for (const name of INTEGRATION_NAMES) {
        result[name] = this.getUrl(`integrations/${name}.webp` as AssetKey);
      }
      return result;
    },
  };

  /**
   * Auth provider icon URL builders
   */
  readonly auth = {
    /**
     * Get auth provider icon URL by name
     * @param name - Auth provider name
     */
    get: (name: AuthProviderName): string => {
      return this.getUrl(`auth/${name}.png` as AssetKey);
    },

    /**
     * Get all auth provider icon URLs as a record
     */
    all: (): Record<AuthProviderName, string> => {
      const result = {} as Record<AuthProviderName, string>;
      for (const name of AUTH_PROVIDER_NAMES) {
        result[name] = this.getUrl(`auth/${name}.png` as AssetKey);
      }
      return result;
    },
  };

  /**
   * Icon asset URL builders
   */
  readonly icons = {
    /**
     * Get icon URL by name
     * @param name - Icon name
     */
    get: (name: IconName): string => {
      return this.getUrl(`icons/${name}.svg` as AssetKey);
    },

    /**
     * Get all icon URLs as a record
     */
    all: (): Record<IconName, string> => {
      const result = {} as Record<IconName, string>;
      for (const name of ICON_NAMES) {
        result[name] = this.getUrl(`icons/${name}.svg` as AssetKey);
      }
      return result;
    },
  };

  /**
   * Intercom canvas image URL builders
   */
  readonly intercomCanvas = {
    /**
     * Get intercom canvas image URL by name
     * @param name - Image name
     */
    get: (name: IntercomCanvasImageName): string => {
      return this.getUrl(INTERCOM_CANVAS_ASSET_KEYS[name] as AssetKey);
    },

    /**
     * Get all intercom canvas image URLs as a record
     */
    all: (): Record<IntercomCanvasImageName, string> => {
      const result = {} as Record<IntercomCanvasImageName, string>;
      for (const name of INTERCOM_CANVAS_IMAGE_NAMES) {
        result[name] = this.getUrl(INTERCOM_CANVAS_ASSET_KEYS[name] as AssetKey);
      }
      return result;
    },
  };
}

/**
 * Create a new MediaClient instance
 *
 * @param config - Client configuration
 * @returns MediaClient instance
 *
 * @example
 * ```typescript
 * const client = createMediaClient({ cdnDomain: 'https://cdn.userplane.io' });
 * ```
 */
export function createMediaClient(config: MediaClientConfig): MediaClient {
  return new MediaClient(config);
}
