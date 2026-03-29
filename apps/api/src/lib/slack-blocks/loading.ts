/**
 * Loading Views
 * Lightweight placeholder views used while async work is in progress.
 *
 * - `buildLoadingModal` – text-only modal opened immediately to consume
 *   the short-lived trigger_id (pre-form).
 * - `buildFrozenLoadingModal` – read-only mirror of the link-creator
 *   modal shown after form submission (post-form).
 * - `buildHomeFrozenLoadingView` – read-only mirror of the home-tab
 *   create-link form shown after the user clicks Create (post-form).
 * - `buildLoadingEphemeral` – ephemeral channel message giving the user
 *   instant feedback while a modal loads.
 */

// ---------------------------------------------------------------------------
// Pre-form loading
// ---------------------------------------------------------------------------

/**
 * Build a skeleton loading modal that mirrors the link-creator form layout.
 * Shows placeholder values where dropdowns and inputs would be, with no
 * submit button. Provides visual continuity so the real form feels like
 * an in-place update rather than a full reset.
 */
export function buildLoadingModal(message = 'Almost there - setting things up for you...') {
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
        elements: [{ type: 'mrkdwn', text: `\u23f3 ${message}` }],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Project*\n_Loading\u2026_' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Domain*\n_Loading\u2026_' },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Title*\n_Loading\u2026_' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Message for the recipient*\n_Loading\u2026_' },
      },
    ],
  };
}

/**
 * Build an ephemeral channel message for pre-form loading.
 * Sent via response_url so the user gets instant feedback in the channel
 * while the loading modal + async work kicks off.
 */
export function buildLoadingEphemeral(message = 'Setting things up\u2026') {
  return {
    response_type: 'ephemeral' as const,
    text: message,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\u23f3 ${message}` },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Post-form frozen loading
// ---------------------------------------------------------------------------

/**
 * Build a frozen loading modal that mirrors the link-creator form layout.
 * Dropdowns and inputs are replaced with read-only section blocks showing
 * the values the user submitted. No submit button — the user sees their
 * selections while async processing runs.
 */
export function buildFrozenLoadingModal(params: {
  projectName: string;
  domainName: string;
  linkTitle?: string;
  customMessage?: string;
}) {
  const blocks: object[] = [
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '\u23f3 This usually takes a few seconds' }],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Project*\n${params.projectName}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Domain*\n${params.domainName}` },
    },
  ];

  if (params.linkTitle || params.customMessage) {
    blocks.push({ type: 'divider' });
  }

  if (params.linkTitle) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Title*\n${params.linkTitle}` },
    });
  }

  if (params.customMessage) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Message for the recipient*\n${params.customMessage}` },
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
        level: 4,
        text: { type: 'plain_text', text: 'Creating your link\u2026' },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '\u23f3 This usually takes a few seconds' }],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Project*\n${params.projectName}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Domain*\n${params.domainName}` },
      },
      { type: 'divider' },
    ],
  };
}
