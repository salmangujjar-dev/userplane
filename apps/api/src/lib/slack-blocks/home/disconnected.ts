/**
 * Home Tab — Disconnected View
 * Shown when the user's Slack workspace is not connected to any Userplane workspace.
 */

import { env } from '@/api/env';

import { SlackActionIds } from '../constants';

/**
 * Build the home tab view for disconnected users.
 * Offers two paths: connect an existing workspace or create a new one.
 */
export function buildHomeDisconnectedView(params: { dashboardUrl: string }) {
  const connectUrl = `${params.dashboardUrl}/_/settings?tab=integrations`;
  const createUrl = `${params.dashboardUrl}/workspace/create?flow=slack`;

  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Resolve customer issues without back-and-forth*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Request screen recordings with console logs, network requests, and session data.',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Already have a workspace? Connect it.\nNew here? Create one first.',
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Connect workspace',
            },
            action_id: SlackActionIds.CONNECT_WORKSPACE,
            url: connectUrl,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create workspace',
            },
            action_id: SlackActionIds.CREATE_WORKSPACE,
            url: createUrl,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Takes less than a minute to set up. Need help? ${env.support.supportEmail}`,
          },
        ],
      },
    ],
  };
}
