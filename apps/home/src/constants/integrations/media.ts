import type { IntegrationAssetKey, MicrositeAssetKey } from '@userplane/storage/media';
import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';

// ── Transform presets ──

const ICON_TRANSFORM = mergeTransformOptions('icon', { width: 48, height: 48, dpr: 2 });
const HERO_TRANSFORM = mergeTransformOptions('feature', { width: 1440 });
const FEATURE_TRANSFORM = mergeTransformOptions('feature', { width: 864 });

// ── Helpers ──

/** Integration brand icon (e.g. `'integrations/chrome.webp'`) */
export function getIconUrl(asset: IntegrationAssetKey) {
  return mediaClient.getIntegrationMediaUrl(asset, { transform: ICON_TRANSFORM });
}

/** Full-width hero image for a microsite */
export function getHeroUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: HERO_TRANSFORM });
}

/** Feature card image */
export function getFeatureUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: FEATURE_TRANSFORM });
}
