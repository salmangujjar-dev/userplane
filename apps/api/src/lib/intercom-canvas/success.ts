/**
 * Success Canvas Builder
 * Shown after a recording link has been created successfully
 */

import type { Canvas } from '@/api/types/intercom-canvas';

export interface SuccessCanvasOptions {
  linkUrl: string;
  linkTitle?: string;
  message?: string;
}

/**
 * Build the success canvas after link creation
 * Contains confirmation message and option to create another link
 */
export function buildSuccessCanvas(options: SuccessCanvasOptions): Canvas {
  return {
    content: {
      components: [
        {
          type: 'text',
          id: 'header',
          text: 'Link Created',
          style: 'header',
        },
        {
          type: 'text',
          id: 'description',
          text: options.message || 'The recording link has been sent to the customer.',
          style: 'paragraph',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'text',
          id: 'link_title',
          text: options.linkTitle || 'Recording Link',
          style: 'muted',
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
          type: 'spacer',
          size: 's',
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
