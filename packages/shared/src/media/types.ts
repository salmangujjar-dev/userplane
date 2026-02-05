/**
 * Media Store Types
 * Type definitions for the centralized media asset management system
 */

// =============================================================================
// Asset Categories
// =============================================================================

/**
 * Categories of media assets in the store
 */
export type AssetCategory =
  | 'brand'
  | 'tiles'
  | 'integrations'
  | 'auth'
  | 'intercom-canvas'
  | 'icons';

/**
 * Theme variants for assets that have light/dark versions
 */
export type ThemeVariant = 'dark' | 'light';

// =============================================================================
// Tile Assets
// =============================================================================

/**
 * Available tile asset names
 */
export type TileName =
  | 'browsercursor'
  | 'bubble'
  | 'documentation'
  | 'fin'
  | 'intercom'
  | 'letterbox'
  | 'lighthouse'
  | 'magf'
  | 'meetview'
  | 'paperplane'
  | 'pointer'
  | 'ring';

// =============================================================================
// Integration Assets
// =============================================================================

/**
 * Available integration names
 */
export type IntegrationName =
  | 'asana'
  | 'clickup'
  | 'crisp'
  | 'discord'
  | 'freshchat'
  | 'freshdesk'
  | 'front'
  | 'happyfox'
  | 'helpscout'
  | 'hiver'
  | 'hubspot'
  | 'intercom'
  | 'jira'
  | 'jiraservicedesk'
  | 'linear'
  | 'make'
  | 'n8n'
  | 'notion'
  | 'plain'
  | 'pylon'
  | 'salesforce'
  | 'sentry'
  | 'slack'
  | 'talkdesk'
  | 'zapier'
  | 'zendesk'
  | 'zoho';

/**
 * Integration asset metadata
 */
export interface IntegrationAsset {
  /** Machine-readable name */
  name: IntegrationName;
  /** Human-readable label */
  label: string;
  /** Alt text for accessibility */
  alt: string;
  /** Relative path to the asset */
  path: string;
}

// =============================================================================
// Auth Assets
// =============================================================================

/**
 * Available auth provider asset names
 */
export type AuthProviderName =
  | 'crisp'
  | 'discord'
  | 'freshdesk'
  | 'happyfox'
  | 'helpscout'
  | 'hiver'
  | 'intercom'
  | 'jira'
  | 'linear'
  | 'pylon'
  | 'slack'
  | 'zendesk';

// =============================================================================
// Icon Assets
// =============================================================================

/**
 * Available icon asset names
 */
export type IconName = 'dino' | 'checkmark' | 'desktop' | 'monitor' | 'video';

// =============================================================================
// Intercom Canvas Assets
// =============================================================================

/**
 * Intercom canvas image asset names
 */
export type IntercomCanvasImageName =
  | 'logo'
  | 'openerRequestRecording'
  | 'openerViewRecordings'
  | 'successLinkCreated'
  | 'errorGeneric'
  | 'accessRequestedLock'
  | 'limitExceededUpgrade';
