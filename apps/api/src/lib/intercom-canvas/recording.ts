/**
 * Recording Canvas Builder
 * Customer-facing canvas with record button shown in Messenger
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { DEFAULT_RECORDING_MESSAGE } from './link-creator';

/**
 * Default footer message for the recording canvas
 */
export const DEFAULT_RECORDING_FOOTER =
  'Your recording will be securely shared with our support team.';

export interface RecordingCanvasOptions {
  linkUrl: string;
  linkTitle?: string;
  customMessage?: string;
  footer?: string | null;
}

/**
 * Build the recording canvas shown to customers
 * Contains a button to open the recording interface
 */
export function buildRecordingCanvas(options: RecordingCanvasOptions): Canvas {
  const message = options.customMessage || DEFAULT_RECORDING_MESSAGE;
  // Use provided footer, or default. If footer is explicitly null, use default.
  const footer = options.footer ?? DEFAULT_RECORDING_FOOTER;

  return {
    content: {
      components: [
        {
          type: 'text',
          id: 'header',
          text: options.linkTitle || 'Screen Recording Request',
          style: 'header',
        },
        {
          type: 'text',
          id: 'description',
          text: message,
          style: 'paragraph',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'record_screen',
          label: 'Record your screen',
          style: 'primary',
          action: {
            type: 'url',
            url: options.linkUrl,
          },
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'text',
          id: 'footer',
          text: footer,
          style: 'muted',
        },
      ],
    },
    stored_data: {
      flow: 'recording',
      link_url: options.linkUrl,
      link_title: options.linkTitle,
      custom_message: options.customMessage,
      footer: options.footer,
    },
  };
}
