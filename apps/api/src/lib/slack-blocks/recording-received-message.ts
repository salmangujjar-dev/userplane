/**
 * Recording Received Message
 * Block Kit message for notifying a channel that a new session recording was submitted.
 */

import { SlackActionIds } from './constants';
import { getSlackCanvasImages } from './urls';

/**
 * Build a channel message announcing a newly received recording.
 * Includes a `text` fallback for push notifications.
 */
export function buildRecordingReceivedMessage(params: { recordingUrl: string }) {
  const images = getSlackCanvasImages();

  return {
    text: 'New recording received',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New recording received*\nSomeone just submitted a screen recording.',
        },
        accessory: {
          type: 'image',
          image_url: images.logo,
          alt_text: 'Userplane',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Watch Recording',
            },
            action_id: SlackActionIds.VIEW_RECORDING,
            url: params.recordingUrl,
            style: 'primary',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: 'Recordings are automatically deleted after 30 days.',
          },
        ],
      },
    ],
  };
}
