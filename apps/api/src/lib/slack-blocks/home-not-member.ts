/**
 * Home Tab — Not Member View
 * Shown when the user's Slack account is not linked to a member
 * of the connected Userplane workspace.
 */

import { env } from '@/api/env';

import { SlackActionIds } from './constants';
import { getSlackCanvasImages, slackCanvasUrls } from './urls';

/**
 * Build the home tab view for users who are not workspace members.
 */
export function buildHomeTabNotMemberView() {
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
          text: "You're almost in!",
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "Your Slack workspace is connected to Userplane, but your account isn't linked yet. Ask a workspace admin to add you and you'll be good to go.",
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Request Access',
            },
            action_id: SlackActionIds.REQUEST_ACCESS,
            url: slackCanvasUrls.workspaceSuggestUrl(),
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
            text: `Stuck? Reach out at ${env.support.supportEmail}`,
          },
        ],
      },
    ],
  };
}
