/**
 * Home Tab — Error View
 * Shown when something goes wrong during a home tab action.
 */

import { env } from '@/api/env';

import { SlackActionIds } from '../constants';

interface HomeErrorAction {
  text: string;
  actionId: string;
  url: string;
  style?: 'primary';
}

/**
 * Build the home tab error view.
 * Displays a user-facing error message with a back button and optional action buttons.
 */
export function buildHomeErrorView(message: string, actions?: HomeErrorAction[]) {
  const actionButtons: unknown[] = [];

  if (actions && actions.length > 0) {
    for (const action of actions) {
      actionButtons.push({
        type: 'button',
        text: { type: 'plain_text', text: action.text },
        action_id: action.actionId,
        url: action.url,
        ...(action.style ? { style: action.style } : {}),
      });
    }
  }

  actionButtons.push({
    type: 'button',
    text: {
      type: 'plain_text',
      text: 'Back to Home',
    },
    action_id: SlackActionIds.HOME_BACK,
  });

  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Something went wrong' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Something went wrong. Please try again.\n\n_${message}_`,
        },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `If this keeps happening, reach out at ${env.support.supportEmail}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: actionButtons,
      },
    ],
  };
}
