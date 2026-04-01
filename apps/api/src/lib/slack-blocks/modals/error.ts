/**
 * Error Modal
 * Modal error view shown when something goes wrong during view submission.
 * Supports optional action buttons for self-service recovery.
 *
 * Layout:
 * - Section: **icon heading** (bold mrkdwn)
 * - Section: description
 * - Actions: optional URL buttons
 * - Divider
 * - Context: support email
 */

import { env } from '@/api/env';

interface ErrorModalAction {
  text: string;
  actionId: string;
  url: string;
  style?: 'primary';
}

interface ErrorModalParams {
  title?: string;
  heading: string;
  description: string;
  actions?: ErrorModalAction[];
}

/**
 * Modal view shown when an error occurs.
 * Replaces the form with a bold heading, description, optional action buttons,
 * and a support footer separated by a divider.
 */
export function buildErrorModalView(params: ErrorModalParams) {
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
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: params.title ?? 'Something went wrong',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks,
  };
}
