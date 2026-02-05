/**
 * Access Requested Canvas Builder
 * Shown when the Intercom admin is not a member of the workspace
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { getCanvasImages, intercomCanvasUrls } from './urls';

export interface AccessRequestedCanvasOptions {
  adminEmail?: string;
}

/**
 * Build the access requested canvas
 * Shown when admin tries to use the app but isn't a workspace member
 * Features centered lock icon and clear instructions
 */
export function buildAccessRequestedCanvas(options: AccessRequestedCanvasOptions): Canvas {
  const signedInText = options.adminEmail ? `Signed in as *${options.adminEmail}*` : undefined;

  const components: Canvas['content']['components'] = [
    {
      type: 'image',
      id: 'logo',
      url: getCanvasImages().accessRequestedLock,
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
      text: "*You don't seem to have access* to the workspace yet.",
      align: 'center',
    },
    {
      type: 'spacer',
      size: 's',
    },
    {
      type: 'text',
      id: 'description',
      text: 'Contact your administrator to get started with Userplane.',
      style: 'muted',
      align: 'center',
    },
  ];

  if (signedInText) {
    components.push(
      {
        type: 'spacer',
        size: 's',
      },
      {
        type: 'text',
        id: 'signed_in',
        text: signedInText,
        style: 'muted',
        align: 'center',
      }
    );
  }

  components.push(
    {
      type: 'spacer',
      size: 'm',
    },
    {
      type: 'button',
      id: 'request_access',
      label: 'Request Access',
      style: 'primary',
      action: {
        type: 'url',
        url: intercomCanvasUrls.workspaceSuggestURL(),
      },
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
    }
  );

  return {
    content: {
      components,
    },
  };
}
