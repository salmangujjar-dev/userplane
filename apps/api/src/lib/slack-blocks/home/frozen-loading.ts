/**
 * Home Frozen Loading View
 * Read-only mirror of the home-tab create-link form shown after
 * the user clicks Create. No action buttons.
 */

/**
 * Build a frozen loading view for the home tab.
 * Mirrors the home-create-link form layout with read-only values
 * and no action buttons.
 */
export function buildHomeFrozenLoadingView(params: { projectName: string; domainName: string }) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Creating your link\u2026' },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: 'Creating your recording link\u2026' }],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Project*\n\`${params.projectName}\`` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Domain*\n\`${params.domainName}\`` },
      },
      { type: 'divider' },
    ],
  };
}
