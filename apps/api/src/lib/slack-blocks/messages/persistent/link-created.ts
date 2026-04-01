/**
 * Link Created Message
 * Block Kit message for notifying a channel that a recording link was created.
 */

import { SlackActionIds } from '../../constants';

/**
 * Build a channel message announcing a newly created recording link.
 * Includes a `text` fallback for push notifications.
 *
 * When a custom message is provided, it is shown as the main text.
 * Otherwise, the default "@user has requested a screen recording" message is used.
 */
export function buildLinkCreatedMessage(params: {
  linkUrl: string;
  slackUserId: string;
  customMessage?: string;
}) {
  const sectionText = params.customMessage
    ? params.customMessage
    : `<@${params.slackUserId}> has requested a screen recording from you.`;

  return {
    text: `New recording link: ${params.linkUrl}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: sectionText,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Share Recording',
          },
          action_id: SlackActionIds.OPEN_LINK,
          url: params.linkUrl,
          style: 'primary',
        },
      },
    ],
  };
}
