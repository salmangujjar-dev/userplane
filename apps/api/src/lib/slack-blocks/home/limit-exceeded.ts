/**
 * Home Tab — Limit Exceeded View
 * Shown when the workspace has exceeded its recording or link limits.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';

/**
 * Build the home tab limit-exceeded view.
 * Prompts the user to upgrade their workspace plan.
 */
export function buildHomeLimitExceededView(params: {
  workspaceId: string;
  limitType: 'recordings' | 'links';
}) {
  const upgradeUrl = slackCanvasUrls.upgradeWorkspaceUrl(params.workspaceId);

  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Limit reached' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "You've used all the recording links on your current plan. Upgrade to keep creating and sharing.",
        },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Upgrade Workspace',
            },
            action_id: SlackActionIds.UPGRADE_WORKSPACE,
            url: upgradeUrl,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Back to Home',
            },
            action_id: SlackActionIds.HOME_BACK,
          },
        ],
      },
    ],
  };
}
