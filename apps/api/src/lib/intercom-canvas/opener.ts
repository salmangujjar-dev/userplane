/**
 * Opener Canvas Builder
 * Main menu canvas shown when teammate opens the Inbox app
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { intercomCanvasUrls } from './urls';

export interface OpenerCanvasOptions {
  workspaceId: string;
  workspaceMemberId: string;
}

/**
 * Build the opener canvas with main action buttons
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
          type: 'text',
          id: 'header',
          text: 'Userplane',
          style: 'header',
        },
        {
          type: 'text',
          id: 'description',
          text: 'Request screen recordings from your customers',
          style: 'paragraph',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'request_recording',
          label: 'Request screen recording',
          style: 'primary',
          action: { type: 'submit' },
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'button',
          id: 'view_recordings',
          label: 'View received recordings',
          style: 'secondary',
          action: {
            type: 'url',
            url: dashboardUrl,
          },
        },
      ],
    },
  };
}
