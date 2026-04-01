/**
 * Loading Modal
 * Skeleton loading modal opened immediately to consume the short-lived
 * trigger_id while async work prepares the real form.
 */

/**
 * Build a skeleton loading modal that mirrors the link-creator form layout.
 * Shows placeholder values where dropdowns and inputs would be, with no
 * submit button. Provides visual continuity so the real form feels like
 * an in-place update rather than a full reset.
 */
export function buildLoadingModalView(message = 'Setting things up\u2026') {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'New recording link',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: message }],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Project*\n`Loading\u2026`' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Domain*\n`Loading\u2026`' },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Link Reference*\n`Loading\u2026`' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Message for the recipient*\n`Loading\u2026`' },
      },
    ],
  };
}
