/**
 * Connect Integration Canvas Builder
 * Shown when user has a Userplane workspace but Intercom is not connected
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { canvasImages, intercomCanvasUrls } from './urls';

export interface ConnectIntegrationCanvasOptions {
  adminEmail?: string;
  workspaceId?: string;
}

/**
 * Build the connect integration canvas
 * Shown when user has a workspace but needs to connect Intercom
 * Features centered logo and clear instructions
 */
export function buildConnectIntegrationCanvas(options: ConnectIntegrationCanvasOptions): Canvas {
  const signedInText = options.adminEmail ? `Signed in as *${options.adminEmail}*` : undefined;

  // Use workspace-specific URL if we have a workspace ID
  const connectUrl = options.workspaceId
    ? intercomCanvasUrls.integrateWorkspaceURLWithWorkspace(options.workspaceId)
    : intercomCanvasUrls.integrateWorkspaceURL();

  const components: Canvas['content']['components'] = [
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
      type: 'text',
      id: 'header',
      text: '*Connect Intercom*',
      align: 'center',
    },
    {
      type: 'spacer',
      size: 's',
    },
    {
      type: 'text',
      id: 'description',
      text: 'Connect Intercom to your Userplane workspace to start requesting screen recordings.',
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
      id: 'connect',
      label: 'Connect Intercom',
      style: 'primary',
      action: {
        type: 'url',
        url: connectUrl,
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
    stored_data: {
      flow: 'connect_integration',
    },
  };
}
