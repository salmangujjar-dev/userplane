/**
 * Loading Modal
 * Lightweight placeholder modal opened immediately to consume the
 * short-lived trigger_id. The view is replaced via views.update once
 * async work (access verification, data fetching) completes.
 */

/**
 * Build a minimal loading modal.
 * Keeping it generic so it can front any slash-command, block-action,
 * or view-submission flow that needs time to resolve.
 */
export function buildLoadingModal(message = 'Loading, please wait\u2026') {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Userplane',
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
          text: message,
        },
      },
    ],
  };
}
