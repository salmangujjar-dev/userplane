import type { FrameworkAssetKey, MicrositeAssetKey } from '@userplane/storage/media';
import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '../../lib/media';

// ── Transform presets ──

const ICON_TRANSFORM = mergeTransformOptions('icon', { width: 48, height: 48, dpr: 2 });
const HERO_TRANSFORM = mergeTransformOptions('feature', { width: 1440 });
const FEATURE_TRANSFORM = mergeTransformOptions('feature', { width: 864 });

// ── Helpers ──

/** Framework brand icon (e.g. `'frameworks/react.svg'`) */
export function getFrameworkIconUrl(asset: FrameworkAssetKey) {
  return mediaClient.getFrameworkMediaUrl(asset, { transform: ICON_TRANSFORM });
}

/** Full-width hero image for a framework microsite */
export function getFrameworkHeroUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: HERO_TRANSFORM });
}

/** Feature card image for a framework microsite */
export function getFrameworkFeatureUrl(asset: MicrositeAssetKey) {
  return mediaClient.getMicrositeMediaUrl(asset, { transform: FEATURE_TRANSFORM });
}
