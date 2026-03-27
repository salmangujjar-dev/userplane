/**
 * Home Tab — Disconnected View
 * Shown when the user's Slack workspace is not connected to any Userplane workspace.
 */

import { SlackActionIds } from './constants';
import { getSlackCanvasImages, slackCanvasUrls } from './urls';

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
        text: {
          type: 'plain_text',
          text: ':link: Connect to Userplane',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your Slack workspace is not connected to Userplane. Connect your workspace from the dashboard to get started.',
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
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Need help? <${slackCanvasUrls.dashboardUrl()}|Get Help>`,
          },
        ],
      },
    ],
  };
}
