/**
 * Error Ephemeral Message
 * Structured ephemeral error message with optional action buttons.
 * Used for channel messages (via response_url) and DMs (via postMessage).
 */

import { env } from '@/api/env';

interface EphemeralErrorAction {
  text: string;
  actionId: string;
  url: string;
  style?: 'primary';
}

/**
 * Build a structured ephemeral error message with optional action buttons.
 *
 * Layout:
 * - Section: **heading**
 * - Section: description
 * - Actions: optional URL buttons
 * - Context: support email
 */
export function buildErrorEphemeral(params: {
  heading: string;
  description: string;
  actions?: EphemeralErrorAction[];
}) {
  const blocks: unknown[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${params.heading}*` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: params.description },
    },
  ];

  if (params.actions && params.actions.length > 0) {
    blocks.push({
      type: 'actions',
      elements: params.actions.map((action) => ({
        type: 'button',
        text: { type: 'plain_text', text: action.text },
        action_id: action.actionId,
        url: action.url,
        ...(action.style ? { style: action.style } : {}),
      })),
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `If this keeps happening, reach out at ${env.support.supportEmail}`,
        },
      ],
    }
  );

  return {
    response_type: 'ephemeral' as const,
    text: params.heading,
    blocks,
  };
}
