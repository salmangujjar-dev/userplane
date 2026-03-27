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
  const ts = Math.floor(Date.now() / 1000);
  const images = getSlackCanvasImages();

  return {
    text: 'New recording received',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':movie_camera: *Recording Received*\n\nA new session recording has been submitted.',
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
              text: 'View Recording',
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
            type: 'mrkdwn',
            text: `Userplane \u00b7 <!date^${ts}^{date}|now>`,
          },
        ],
      },
    ],
  };
}
