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
  IconName,
  IntegrationAsset,
  IntegrationName,
  IntercomCanvasImageName,
  ThemeVariant,
  TileName,
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

export { ASSET_MANIFEST, type AssetKey } from './manifest.generated';

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
