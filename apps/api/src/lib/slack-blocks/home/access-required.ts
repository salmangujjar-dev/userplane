/**
 * Home Tab — Access Required View
 * Shown when the user is not a member of the connected Userplane workspace.
 */

import { env } from '@/api/env';

import { SlackActionIds } from '../constants';
import { getSlackCanvasImages, slackCanvasUrls } from '../urls';

/**
 * Build the home tab access-required view.
 * Directs the user to request workspace access.
 */
export function buildHomeAccessRequiredView(params?: { email?: string }) {
  const images = getSlackCanvasImages();
  const emailHint = params?.email ? ` (\`${params.email}\`)` : '';

  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'image',
        image_url: images.logo,
        alt_text: 'Userplane',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Almost there',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Your Slack account${emailHint} isn't a member of this Userplane workspace yet.\n\nAsk a workspace admin to add you - it only takes a moment.`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Request Access',
            },
            action_id: SlackActionIds.REQUEST_ACCESS,
            url: slackCanvasUrls.workspaceSuggestUrl(),
            style: 'primary',
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
            text: `Stuck? Reach out at ${env.support.supportEmail}`,
          },
        ],
      },
    ],
  };
}
