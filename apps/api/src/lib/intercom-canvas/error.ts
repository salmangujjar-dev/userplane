/**
 * Error Canvas Builder
 * Generic error canvas for various error states
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { getCanvasImages, intercomCanvasUrls } from './urls';

export interface ErrorCanvasOptions {
  title?: string;
  message: string;
  showRetry?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Build a generic error canvas
 * Configurable title, message, and optional action button
 * Features centered error icon and clear messaging
 */
export function buildErrorCanvas(options: ErrorCanvasOptions): Canvas {
  const headerText = options.title ? `*${options.title}*` : '*Something went wrong*';

  const components: Canvas['content']['components'] = [
    {
      type: 'image',
      id: 'icon',
      url: getCanvasImages().errorGeneric,
      align: 'center',
      width: 50,
      height: 50,
    },
    {
      type: 'spacer',
      size: 'm',
    },
    {
      type: 'text',
      id: 'header',
      text: headerText,
      align: 'center',
    },
    {
      type: 'spacer',
      size: 's',
    },
    {
      type: 'text',
      id: 'description',
      text: options.message,
      style: 'muted',
      align: 'center',
    },
    {
      type: 'spacer',
      size: 'm',
    },
  ];

  if (options.showRetry) {
    components.push({
      type: 'button',
      id: 'retry',
      label: 'Try again',
      style: 'primary',
      action: { type: 'submit' },
    });
  }

  if (options.actionUrl && options.actionLabel) {
    components.push({
      type: 'button',
      id: 'action',
      label: options.actionLabel,
      style: options.showRetry ? 'secondary' : 'primary',
      action: {
        type: 'url',
        url: options.actionUrl,
      },
    });
  }

  // Always show Contact Support and Go Back buttons
  components.push(
    {
      type: 'button',
      id: 'contact_support',
      label: 'Contact Support',
      style: options.showRetry || options.actionUrl ? 'secondary' : 'primary',
      action: {
        type: 'url',
        url: intercomCanvasUrls.supportEmailURL(),
      },
    },
    {
      type: 'button',
      id: 'go_back',
      label: 'Go back',
      style: 'secondary',
      action: { type: 'submit' },
    }
  );

  return {
    content: {
      components,
    },
    stored_data: {
      flow: 'error',
    },
  };
}

/**
 * Build error canvas for integration not found
 */
export function buildIntegrationNotFoundCanvas(): Canvas {
  const setupUrl = intercomCanvasUrls.integrateWorkspaceURL();
  return buildErrorCanvas({
    title: 'Integration Not Found',
    message: 'The Intercom integration has not been set up for this workspace.',
    actionUrl: setupUrl,
    actionLabel: 'Setup Integration',
  });
}

/**
 * Build error canvas for general canvas errors
 */
export function buildCanvasErrorCanvas(): Canvas {
  return buildErrorCanvas({
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    showRetry: true,
  });
}
