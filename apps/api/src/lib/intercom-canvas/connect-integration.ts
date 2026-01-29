/**
 * Connect Integration Canvas Builder
 * Shown when user has a Userplane workspace but Intercom is not connected
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { intercomCanvasUrls } from './urls';

export interface ConnectIntegrationCanvasOptions {
  adminEmail?: string;
  workspaceId?: string;
}

/**
 * Build the connect integration canvas
 * Shown when user has a workspace but needs to connect Intercom
 */
export function buildConnectIntegrationCanvas(options: ConnectIntegrationCanvasOptions): Canvas {
  const components: Canvas['content']['components'] = [
    {
      type: 'text',
      id: 'header',
      text: 'Connect Intercom',
      style: 'header',
    },
    {
      type: 'text',
      id: 'description',
      text: 'Connect Intercom to your Userplane workspace to start requesting screen recordings.',
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

  // Use workspace-specific URL if we have a workspace ID
  const connectUrl = options.workspaceId
    ? intercomCanvasUrls.integrateWorkspaceURLWithWorkspace(options.workspaceId)
    : intercomCanvasUrls.integrateWorkspaceURL();

  components.push({
    type: 'button',
    id: 'connect',
    label: 'Connect Intercom',
    style: 'primary',
    action: {
      type: 'url',
      url: connectUrl,
    },
  });

  return {
    content: {
      components,
    },
    stored_data: {
      flow: 'connect_integration',
    },
  };
}
