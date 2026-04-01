/**
 * Recording Received Message
 * Block Kit message for notifying the link creator that a screen recording was submitted.
 */

import { SlackActionIds } from '../../constants';

/**
 * Build a DM message for the link creator with two buttons:
 * - "View Recording" — opens the recording in the dashboard
 * - "View Original Message" — deep links back to the original Slack message (when permalink available)
 */
export function buildRecordingReceivedMessage(params: {
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
        text: 'View Original Message',
      },
      action_id: SlackActionIds.VIEW_MESSAGE,
      url: params.permalink,
    });
  }

  const contextElements: { type: 'mrkdwn'; text: string }[] = [];

  if (params.permalink && params.channelName) {
    contextElements.push({
      type: 'mrkdwn',
      text: `Originally requested in <${params.permalink}|#${params.channelName}>`,
    });
  } else if (params.channelName) {
    contextElements.push({
      type: 'mrkdwn',
      text: `Originally requested in #${params.channelName}`,
    });
  }

  return {
    text: 'Recording received',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Recording received*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your requested screen recording is ready to view.',
        },
      },
      ...(contextElements.length > 0
        ? [
            {
              type: 'context' as const,
              elements: contextElements,
            },
          ]
        : []),
      { type: 'divider' },
      {
        type: 'actions',
        elements: buttons,
      },
    ],
  };
}
