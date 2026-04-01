/**
 * Access Required Modal
 * Shown when the user is not a member of the connected Userplane workspace.
 */

import { env } from '@/api/env';

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';

/**
 * Build the access-required modal view.
 * Directs the user to request workspace access.
 */
export function buildAccessRequiredModalView(params?: { email?: string }) {
  const emailHint = params?.email ? ` (\`${params.email}\`)` : '';

  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Access required',
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
          text: `*You\u2019re not a member yet*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Your Slack account${emailHint} isn\u2019t part of this Userplane workspace. Ask a workspace admin to invite you.`,
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
