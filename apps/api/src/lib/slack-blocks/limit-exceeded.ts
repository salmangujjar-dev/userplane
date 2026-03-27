/**
 * Limit Exceeded Modal
 * Shown when the workspace has exceeded its recording or link limits.
 */

import { SlackActionIds } from './constants';
import { slackCanvasUrls } from './urls';

/**
 * Build the limit-exceeded modal view.
 * Prompts the user to upgrade their workspace plan.
 */
export function buildLimitExceededView(params: {
  workspaceId: string;
  limitType?: 'recordings' | 'links';
}) {
  const upgradeUrl = slackCanvasUrls.upgradeWorkspaceUrl(params.workspaceId);
  const limitDescription =
    params.limitType === 'links'
      ? "You've reached the maximum number of recording links for your workspace."
      : "You've reached the maximum number of recordings for your workspace.";

  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Limit Reached',
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
          text: limitDescription,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Upgrade your workspace to continue creating recording links.',
        },
      },
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
        ],
      },
    ],
  };
}
