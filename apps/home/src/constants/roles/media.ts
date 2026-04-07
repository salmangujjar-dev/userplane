import type { MicrositeAssetKey } from '@userplane/storage/media';
import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';

// ── Transform presets ──

const HERO_TRANSFORM = mergeTransformOptions('feature', { width: 1440 });
const FEATURE_TRANSFORM = mergeTransformOptions('feature', { width: 864 });

// ── Helpers ──

/** Full-width hero image for a role microsite */
export function getRoleHeroUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: HERO_TRANSFORM });
}

/** Feature card image for a role microsite */
export function getRoleFeatureUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: FEATURE_TRANSFORM });
}
