/**
 * Opener Canvas Builder
 * Main menu canvas shown when teammate opens the Inbox app
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { canvasImages, intercomCanvasUrls } from './urls';

export interface OpenerCanvasOptions {
  workspaceId: string;
  workspaceMemberId: string;
}

/**
 * Build the opener canvas with main action buttons using list component
 * - "Request screen recording" - Primary action to create a recording link
 * - "View received recordings" - Link to dashboard recordings page
 */
export function buildOpenerCanvas(options: OpenerCanvasOptions): Canvas {
  const dashboardUrl = intercomCanvasUrls.accessUserSubmittedRecordingsURL(
    options.workspaceId,
    options.workspaceMemberId
  );

  return {
    content: {
      components: [
        {
          type: 'image',
          id: 'logo',
          url: canvasImages.logo,
          align: 'center',
          width: 50,
          height: 50,
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'list',
          disabled: false,
          items: [
            {
              type: 'item',
              id: 'request_recording',
              title: 'Request screen recording',
              subtitle: 'Get a screen recording for troubleshooting',
              image: canvasImages.openerRequestRecording,
              image_width: 30,
              image_height: 30,
              disabled: false,
              action: { type: 'submit' },
            },
            {
              type: 'item',
              id: 'view_recordings',
              title: 'View received recordings',
              subtitle: 'Review recordings to resolve issues',
              image: canvasImages.openerViewRecordings,
              image_width: 30,
              image_height: 30,
              disabled: false,
              action: {
                type: 'url',
                url: dashboardUrl,
              },
            },
          ],
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'contact_support',
          label: 'Contact Support',
          style: 'secondary',
          action: {
            type: 'url',
            url: intercomCanvasUrls.supportEmailURL(),
          },
        },
      ],
    },
  };
}
