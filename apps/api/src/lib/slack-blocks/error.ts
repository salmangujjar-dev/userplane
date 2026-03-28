/**
 * Error Views
 * Modal and ephemeral error views for the Slack integration.
 */

import { env } from '@/api/env';

/**
 * Modal view shown when an error occurs during view submission.
 * Replaces the form with a user-facing error message.
 */
export function buildErrorModalView(message: string) {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Something went wrong',
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
          text: `We hit a snag - sorry about that.\n\n_${message}_`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `If this keeps happening, reach out at ${env.support.supportEmail}`,
          },
        ],
      },
    ],
  };
}

/**
 * Simple ephemeral error message blocks.
 */
export function buildErrorEphemeral(message: string) {
  return {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${message}\n\nIf this keeps happening, reach out at ${env.support.supportEmail}`,
        },
      },
    ],
  };
}
