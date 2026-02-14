/**
 * DOM element creation utilities
 * Handles creation and styling of overlay and iframe elements.
 */

import { createSdkLogger } from '../logger';
import type { FrameConfig } from '../types';

const logger = createSdkLogger('FrameDOM');

/**
 * Creates the overlay container element.
 * Full-screen dimmed backdrop with optional blur effect.
 *
 * @param config - Frame configuration containing styling options
 * @returns Configured HTMLDivElement
 */
export function createOverlay(config: FrameConfig): HTMLDivElement {
  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    inset: '0',
    zIndex: config.zIndex,
    backgroundColor: config.overlayBackgroundColor,
    pointerEvents: 'none',
    ...(config.backdropBlur && { backdropFilter: 'blur(5px)' }),
  });

  return overlay;
}

/**
 * Creates and configures the iframe element.
 * Sets up sandbox, permissions, and event handlers based on config.
 *
 * @param config - Frame configuration containing iframe options and callbacks
 * @returns Configured HTMLIFrameElement
 */
export function createIframe(config: FrameConfig): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    pointerEvents: 'auto',
    border: 'none',
  });

  iframe.src = config.url;
  iframe.dataset.userplaneRecorder = '';
  iframe.setAttribute('sandbox', config.sandbox);
  iframe.setAttribute('allow', config.allow);

  if (config.allowFullscreen) {
    iframe.setAttribute('allowfullscreen', 'true');
  }

  if (config.onLoad) {
    iframe.addEventListener('load', () => {
      logger.debug('Iframe loaded successfully');
      config.onLoad?.();
    });
  }

  if (config.onError) {
    iframe.addEventListener('error', () => {
      logger.error('Error loading iframe');
      config.onError?.();
    });
  }

  return iframe;
}

/**
 * Checks if an iframe with the userplane recorder marker exists in the DOM.
 *
 * @returns true if a recorder iframe is found, false otherwise
 */
export function hasExistingRecorder(): boolean {
  return document.querySelector('iframe[data-userplane-recorder]') !== null;
}
