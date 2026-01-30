/**
 * Success Canvas Builder
 * Shown after a recording link has been created successfully
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { canvasImages } from './urls';

export interface SuccessCanvasOptions {
  linkUrl: string;
  linkTitle?: string;
  message?: string;
}

/**
 * Build the success canvas after link creation
 * Contains confirmation message and option to create another link
 * Features centered success checkmark and clear confirmation
 */
export function buildSuccessCanvas(options: SuccessCanvasOptions): Canvas {
  const displayMessage =
    options.message || 'Good to go! Your recording link is live and ready to use.';

  return {
    content: {
      components: [
        {
          type: 'image',
          id: 'icon',
          url: canvasImages.successLinkCreated,
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
          text: '*Recording link created*',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'text',
          id: 'description',
          text: displayMessage,
          style: 'muted',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'create_another',
          label: 'Create another link',
          style: 'secondary',
          action: { type: 'submit' },
        },
        {
          type: 'button',
          id: 'done',
          label: 'Done',
          style: 'primary',
          action: { type: 'submit' },
        },
      ],
    },
    stored_data: {
      flow: 'success',
      linkUrl: options.linkUrl,
    },
  };
}
