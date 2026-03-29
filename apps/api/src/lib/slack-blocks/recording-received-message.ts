/**
 * Recording Received Messages
 * Block Kit messages for notifying users that a new session recording was submitted.
 */

import { SlackActionIds } from './constants';

/**
 * Build a DM message for the link creator with two buttons:
 * - "View Recording" — opens the recording in the dashboard
 * - "View Message" — deep links back to the original Slack message (when permalink available)
 */
export function buildRecordingDmMessage(params: {
  recordingUrl: string;
  permalink?: string;
  channelName?: string;
}) {
  const buttons: unknown[] = [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View Recording',
      },
      action_id: SlackActionIds.VIEW_RECORDING,
      url: params.recordingUrl,
      style: 'primary',
    },
  ];

  if (params.permalink) {
    buttons.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View Message',
      },
      action_id: SlackActionIds.VIEW_MESSAGE,
      url: params.permalink,
    });
  }

  const contextElements: { type: 'mrkdwn'; text: string }[] = [];

  if (params.permalink && params.channelName) {
    contextElements.push({
      type: 'mrkdwn',
      text: `Originally shared in <${params.permalink}|#${params.channelName}>`,
    });
  } else if (params.channelName) {
    contextElements.push({
      type: 'mrkdwn',
      text: `Originally shared in #${params.channelName}`,
    });
  }

  return {
    text: 'New recording received',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New recording received*\nSomeone submitted a screen recording for a link you shared.',
        },
      },
      {
        type: 'actions',
        elements: buttons,
      },
      ...(contextElements.length > 0
        ? [
            {
              type: 'context' as const,
              elements: contextElements,
            },
          ]
        : []),
    ],
  };
}
