/**
 * Frozen Loading Modal
 * Read-only mirror of the link-creator modal shown after form submission.
 * Displays the user's selections while async processing runs.
 */

/**
 * Build a frozen loading modal that mirrors the link-creator form layout.
 * Dropdowns and inputs are replaced with read-only section blocks showing
 * the values the user submitted. No submit button — the user sees their
 * selections while async processing runs.
 */
export function buildFrozenLoadingModalView(params: {
  projectName: string;
  domainName: string;
  linkTitle?: string;
  customMessage?: string;
}) {
  const blocks: object[] = [
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: 'Creating your recording link\u2026' }],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Project*\n\`${params.projectName}\`` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Domain*\n\`${params.domainName}\`` },
    },
  ];

  if (params.linkTitle || params.customMessage) {
    blocks.push({ type: 'divider' });
  }

  if (params.linkTitle) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Link Reference*\n\`${params.linkTitle}\`` },
    });
  }

  if (params.customMessage) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Message for the recipient*\n\`${params.customMessage}\`` },
    });
  }

  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Creating your link\u2026',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks,
  };
}
