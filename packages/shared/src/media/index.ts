/**
 * Media Store
 * Centralized media asset management for Userplane
 *
 * @packageDocumentation
 */

// =============================================================================
// Types
// =============================================================================

export type {
  AssetCategory,
  AuthProviderName,
  IntegrationAsset,
  IntegrationName,
  IntercomCanvasImageName,
  ThemeVariant,
  TileName,
} from './types';

// =============================================================================
// Config
// =============================================================================

export { MEDIA_CDN_URL } from './config';

// =============================================================================
// Manifest
// =============================================================================

export { ASSET_MANIFEST, type AssetKey } from './manifest.generated';

// =============================================================================
// URLs
// =============================================================================

export { authUrls, brandUrls, integrationUrls, intercomCanvasUrls, tileUrls } from './urls';

// =============================================================================
// Registry
// =============================================================================

export type { AuthProviderAsset } from './registry';
export {
  AUTH_PROVIDER_REGISTRY,
  getAuthProviderAsset,
  getAuthProviderAssets,
  getIntegrationAsset,
  getIntegrationAssets,
  INTEGRATION_REGISTRY,
} from './registry';
