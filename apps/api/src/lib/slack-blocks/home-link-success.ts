/**
 * Home Tab - Link Success View
 * Shown after a recording link is created from the home tab.
 */

import { SlackActionIds } from './constants';

/**
 * Build the home tab link success view.
 */
export function buildHomeLinkSuccessView(params: { linkUrl: string }) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        level: 4,
        text: { type: 'plain_text', text: 'Link created' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "Your recording link is ready. Share it with anyone - they'll be able to record their screen with one click.",
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${params.linkUrl}|Open recording link>`,
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Share Recording' },
          action_id: SlackActionIds.OPEN_LINK,
          url: params.linkUrl,
          style: 'primary',
        },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Back to Home' },
            action_id: SlackActionIds.HOME_BACK,
          },
        ],
      },
    ],
  };
}
