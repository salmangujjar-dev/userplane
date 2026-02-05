/**
 * Media Store URL Builders
 * Functions for constructing CDN URLs to media assets
 */

import { mediaEnv } from './env';
import { ASSET_MANIFEST, type AssetKey } from './manifest.generated';
import type {
  AuthProviderName,
  IntegrationName,
  IntercomCanvasImageName,
  ThemeVariant,
  TileName,
} from './types';

// =============================================================================
// URL Resolution
// =============================================================================

/**
 * Get CDN URL for an asset by its key
 * @param key - Asset key (e.g., 'brand/logo-dark.svg')
 * @returns Full CDN URL with content hash
 * @throws Error if asset key is not found in manifest
 */
function getMediaUrl(key: string): string {
  const hashedPath = ASSET_MANIFEST[key as AssetKey];
  if (!hashedPath) {
    throw new Error(`Unknown asset: ${key}`);
  }
  return `${mediaEnv.cdnUrl}/${hashedPath}`;
}

// =============================================================================
// Brand URLs
// =============================================================================

/**
 * Brand asset URL builders
 */
export const brandUrls = {
  /**
   * Get logo URL for a theme variant
   * @param theme - 'dark' or 'light'
   */
  logo(theme: ThemeVariant): string {
    return getMediaUrl(`brand/logo-${theme}.svg`);
  },

  /**
   * Get favicon URL
   */
  favicon(): string {
    return getMediaUrl('brand/favicon.svg');
  },
} as const;

// =============================================================================
// Tile URLs
// =============================================================================

/**
 * Tile asset URL builders
 */
export const tileUrls = {
  /**
   * Get tile URL by name
   * @param name - Tile name
   */
  get(name: TileName): string {
    return getMediaUrl(`tiles/${name}.png`);
  },

  /**
   * Get all tile URLs as a record
   */
  all(): Record<TileName, string> {
    const tiles: TileName[] = [
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
    ];
    const result = {} as Record<TileName, string>;
    for (const name of tiles) {
      result[name] = getMediaUrl(`tiles/${name}.png`);
    }
    return result;
  },
} as const;

// =============================================================================
// Integration URLs
// =============================================================================

/**
 * Integration asset URL builders
 */
export const integrationUrls = {
  /**
   * Get integration logo URL by name
   * @param name - Integration name
   */
  get(name: IntegrationName): string {
    return getMediaUrl(`integrations/${name}.webp`);
  },

  /**
   * Get all integration logo URLs as a record
   */
  all(): Record<IntegrationName, string> {
    const integrations: IntegrationName[] = [
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
    ];
    const result = {} as Record<IntegrationName, string>;
    for (const name of integrations) {
      result[name] = getMediaUrl(`integrations/${name}.webp`);
    }
    return result;
  },
} as const;

// =============================================================================
// Auth URLs
// =============================================================================

/**
 * Auth provider icon URL builders
 */
export const authUrls = {
  /**
   * Get auth provider icon URL by name
   * @param name - Auth provider name
   */
  get(name: AuthProviderName): string {
    return getMediaUrl(`auth/${name}.png`);
  },

  /**
   * Get all auth provider icon URLs as a record
   */
  all(): Record<AuthProviderName, string> {
    const providers: AuthProviderName[] = [
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
    ];
    const result = {} as Record<AuthProviderName, string>;
    for (const name of providers) {
      result[name] = getMediaUrl(`auth/${name}.png`);
    }
    return result;
  },
} as const;

// =============================================================================
// Intercom Canvas URLs
// =============================================================================

/**
 * Mapping from IntercomCanvasImageName to asset file paths
 */
const INTERCOM_CANVAS_ASSET_KEYS: Record<IntercomCanvasImageName, string> = {
  logo: 'intercom-canvas/userplane-icon.png',
  openerRequestRecording: 'intercom-canvas/intercom/request-recording.png',
  openerViewRecordings: 'intercom-canvas/intercom/view-recordings.png',
  successLinkCreated: 'intercom-canvas/intercom/success.png',
  errorGeneric: 'intercom-canvas/intercom/error.png',
  accessRequestedLock: 'intercom-canvas/intercom/lock.png',
  limitExceededUpgrade: 'intercom-canvas/intercom/upgrade.png',
};

/**
 * Intercom canvas image URL builders
 * These images are served from the CDN
 */
export const intercomCanvasUrls = {
  /**
   * Get intercom canvas image URL by name
   * @param name - Image name
   */
  get(name: IntercomCanvasImageName): string {
    return getMediaUrl(INTERCOM_CANVAS_ASSET_KEYS[name]);
  },

  /**
   * Get all intercom canvas image URLs as a record
   */
  all(): Record<IntercomCanvasImageName, string> {
    const names: IntercomCanvasImageName[] = [
      'logo',
      'openerRequestRecording',
      'openerViewRecordings',
      'successLinkCreated',
      'errorGeneric',
      'accessRequestedLock',
      'limitExceededUpgrade',
    ];
    const result = {} as Record<IntercomCanvasImageName, string>;
    for (const name of names) {
      result[name] = getMediaUrl(INTERCOM_CANVAS_ASSET_KEYS[name]);
    }
    return result;
  },
} as const;
