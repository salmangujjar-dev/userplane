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
  FeatureAssetKey,
  HeroAssetKey,
  IconAssetKey,
  IntegrationAssetKey,
  IntercomCanvasAssetKey,
  PreviewAssetKey,
  SpotlightAssetKey,
  TileAssetKey,
  ZendeskAssetKey,
} from './types';

// =============================================================================
// Client
// =============================================================================

export {
  createMediaClient,
  DEFAULT_CDN_DOMAIN,
  DEFAULT_CDN_PREFIX,
  type GetMediaUrlOptions,
  MediaClient,
  type MediaClientConfig,
} from './client';

// =============================================================================
// Transform
// =============================================================================

export {
  buildTransformUrl,
  DEFAULT_IMAGE_ZONE,
  getTransformProfile,
  mergeTransformOptions,
  TRANSFORM_PROFILES,
  type TransformOptions,
  type TransformProfile,
} from './transform';

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
