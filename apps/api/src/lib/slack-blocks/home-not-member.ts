/**
 * Home Tab — Not Member View
 * Shown when the user's Slack account is not linked to a member
 * of the connected Userplane workspace.
 */

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
        text: {
          type: 'plain_text',
          text: ':lock: Access Required',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':lock: *Access Required*\n\nYour Slack account is not linked to a member of the connected Userplane workspace. Ask a workspace admin to add you.',
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
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Get Help',
            },
            action_id: SlackActionIds.CONTACT_SUPPORT,
            url: slackCanvasUrls.dashboardUrl(),
          },
        ],
      },
    ],
  };
}
