/**
 * Home Tab — Disconnected View
 * Shown when the user's Slack workspace is not connected to any Userplane workspace.
 */

import { env } from '@/api/env';

import { SlackActionIds } from './constants';
import { getSlackCanvasImages } from './urls';

/**
 * Build the home tab view for disconnected users.
 * Prompts them to connect their workspace from the dashboard.
 */
export function buildHomeTabDisconnectedView(params: { dashboardUrl: string }) {
  const images = getSlackCanvasImages();

  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'image',
        image_url: images.logo,
        alt_text: 'Userplane',
      },
      {
        type: 'header',
        level: 4,
        text: {
          type: 'plain_text',
          text: 'Get started with Userplane',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Connect your Slack workspace to start creating and sharing screen recording links with your team - right from here.',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Connect Workspace',
            },
            action_id: SlackActionIds.CONNECT_WORKSPACE,
            url: params.dashboardUrl,
            style: 'primary',
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Need a hand? Reach out at ${env.support.supportEmail}`,
          },
        ],
      },
    ],
  };
}
