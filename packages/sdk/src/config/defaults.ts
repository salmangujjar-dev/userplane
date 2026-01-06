/**
 * Default configuration values for the recorder frame.
 */

import type { FrameConfig } from '../types';

/**
 * Default configuration values.
 * Used as base configuration when building frame config.
 */
export const DEFAULT_FRAME_CONFIG: Omit<FrameConfig, 'url' | 'onLoad' | 'onError'> = {
  zIndex: '2147483647',
  overlayBackgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropBlur: true,
  sandbox: 'allow-same-origin allow-scripts allow-popups',
  allow: 'microphone; camera; display-capture',
  allowFullscreen: true,
};
