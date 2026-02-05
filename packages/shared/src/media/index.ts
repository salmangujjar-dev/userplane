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
  AssetKey,
  AuthAssetKey,
  BrandAssetKey,
  IconAssetKey,
  IntegrationAssetKey,
  IntercomCanvasAssetKey,
  TileAssetKey,
} from './types';

// =============================================================================
// Client
// =============================================================================

export {
  createMediaClient,
  DEFAULT_CDN_DOMAIN,
  DEFAULT_CDN_PREFIX,
  MediaClient,
  type MediaClientConfig,
} from './client';

// =============================================================================
// Manifest
// =============================================================================

export { ASSET_MANIFEST } from './manifest.generated';

// =============================================================================
// Registry
// =============================================================================

export type { AuthProviderAsset, IntegrationAsset } from './registry';
export {
  AUTH_PROVIDER_REGISTRY,
  getAuthProviderAsset,
  getAuthProviderAssets,
  getIntegrationAsset,
  getIntegrationAssets,
  INTEGRATION_REGISTRY,
} from './registry';
