/**
 * Access Required Modal
 * Shown when the user is not a member of the connected Userplane workspace.
 */

import { SlackActionIds } from './constants';
import { slackCanvasUrls } from './urls';

/**
 * Build the access-required modal view.
 * Directs the user to request workspace access or contact support.
 */
export function buildAccessRequiredView() {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Request Access',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ":lock: *Access Required*\n\nYou're not a member of the connected Userplane workspace yet. Ask a workspace admin to add you.",
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
