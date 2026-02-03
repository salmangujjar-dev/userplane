/**
 * Recording Canvas Builder
 * Customer-facing canvas with record button shown in Messenger
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { DEFAULT_RECORDING_MESSAGE } from './link-creator';
import { canvasImages } from './urls';

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
  /** Custom logo URL to display instead of default Userplane logo */
  logoUrl?: string | null;
}

/**
 * Build the recording canvas shown to customers
 * Contains a button to open the recording interface
 * Features centered logo and clean layout
 */
export function buildRecordingCanvas(options: RecordingCanvasOptions): Canvas {
  const message = options.customMessage || DEFAULT_RECORDING_MESSAGE;
  // Use provided footer, or default. If footer is explicitly null, use default.
  const footer = options.footer ?? DEFAULT_RECORDING_FOOTER;
  // Use custom logo URL if provided, otherwise fall back to default Userplane logo
  const logoUrl = options.logoUrl || canvasImages.logo;

  return {
    content: {
      components: [
        {
          type: 'image',
          id: 'logo',
          url: logoUrl,
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
          id: 'description',
          text: message,
          style: 'muted',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'record_screen',
          label: 'Record screen',
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
          align: 'center',
        },
      ],
    },
    stored_data: {
      flow: 'recording',
      link_url: options.linkUrl,
      link_title: options.linkTitle,
      custom_message: options.customMessage,
      footer: options.footer,
      logo_url: options.logoUrl,
    },
  };
}
