/**
 * Media Store Types
 * Category key types derived from the auto-generated asset manifest.
 * Each type is a simple Extract filter on AssetKey for compile-time safety.
 */

import type { AssetKey } from './manifest.generated';

// Category key types - simple Extract filters on AssetKey
export type IntegrationAssetKey = Extract<AssetKey, `integrations/${string}`>;
export type BrandAssetKey = Extract<AssetKey, `brand/${string}`>;
export type TileAssetKey = Extract<AssetKey, `tiles/${string}`>;
export type IconAssetKey = Extract<AssetKey, `icons/${string}`>;
export type IntercomAssetKey = Extract<AssetKey, `intercom/${string}`>;
export type SlackAssetKey = Extract<AssetKey, `slack/${string}`>;
export type FeatureAssetKey = Extract<AssetKey, `features/${string}`>;
export type LaunchAssetKey = Extract<AssetKey, `launch/${string}`>;
export type SpotlightAssetKey = Extract<AssetKey, `spotlight/${string}`>;
export type MicrositeAssetKey = Extract<AssetKey, `microsites/${string}`>;
export type FrameworkAssetKey = Extract<AssetKey, `frameworks/${string}`>;

// Re-export AssetKey for generic use
export type { AssetKey } from './manifest.generated';
