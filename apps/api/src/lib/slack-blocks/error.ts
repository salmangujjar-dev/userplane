/**
 * Error Views
 * Modal and ephemeral error views for the Slack integration.
 */

/**
 * Modal view shown when an error occurs during view submission.
 * Replaces the form with a user-facing error message.
 */
export function buildErrorModalView(message: string) {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Error',
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
          text: `:warning: ${message}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'If this persists, contact support.',
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
          text: `:warning: ${message}`,
        },
      },
    ],
  };
}
