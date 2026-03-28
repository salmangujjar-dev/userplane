/**
 * Access Required Modal
 * Shown when the user is not a member of the connected Userplane workspace.
 */

import { SlackActionIds } from './constants';
import { slackCanvasUrls } from './urls';

/**
 * Build the access-required modal view.
 * Directs the user to request workspace access.
 */
export function buildAccessRequiredView() {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Almost there',
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
          text: "You're not a member of this Userplane workspace yet.\n\nAsk a workspace admin to add you - it only takes a moment.",
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
    ],
  };
}
