/**
 * Access Requested Canvas Builder
 * Shown when the Intercom admin is not a member of the workspace
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { intercomCanvasUrls } from './urls';

export interface AccessRequestedCanvasOptions {
  adminEmail?: string;
}

/**
 * Build the access requested canvas
 * Shown when admin tries to use the app but isn't a workspace member
 */
export function buildAccessRequestedCanvas(options: AccessRequestedCanvasOptions): Canvas {
  const components: Canvas['content']['components'] = [
    {
      type: 'text',
      id: 'header',
      text: 'Access Required',
      style: 'header',
    },
    {
      type: 'text',
      id: 'description',
      text: "You don't have access to this workspace. Please contact your workspace administrator to get access.",
      style: 'paragraph',
    },
    {
      type: 'spacer',
      size: 'm',
    },
  ];

  if (options.adminEmail) {
    components.push({
      type: 'text',
      id: 'email_info',
      text: `Signed in as: ${options.adminEmail}`,
      style: 'muted',
    });
    components.push({
      type: 'spacer',
      size: 's',
    });
  }

  components.push({
    type: 'button',
    id: 'contact_admin',
    label: 'Contact Support',
    style: 'secondary',
    action: {
      type: 'url',
      url: intercomCanvasUrls.supportEmailURL(),
    },
  });

  return {
    content: {
      components,
    },
  };
}
