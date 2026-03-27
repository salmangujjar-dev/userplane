/**
 * Link Created Message
 * Block Kit message for notifying a channel that a recording link was created.
 */

import { SlackActionIds } from './constants';
import { getSlackCanvasImages } from './urls';

/**
 * Build a channel message announcing a newly created recording link.
 * Includes a `text` fallback for push notifications.
 */
export function buildLinkCreatedMessage(params: {
  linkUrl: string;
  projectName: string;
  createdBy: string;
  customMessage?: string;
  dashboardUrl?: string;
}) {
  const ts = Math.floor(Date.now() / 1000);

  const images = getSlackCanvasImages();

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:link: *New Recording Link*\n*Project:* ${params.projectName}\n*Link:* <${params.linkUrl}|${params.linkUrl}>`,
      },
      accessory: {
        type: 'image',
        image_url: images.logo,
        alt_text: 'Userplane',
      },
    },
  ];

  if (params.customMessage) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `> ${params.customMessage}`,
      },
    });
  }

  const actionElements: Array<Record<string, unknown>> = [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Open Link',
      },
      action_id: SlackActionIds.OPEN_LINK,
      url: params.linkUrl,
    },
  ];

  if (params.dashboardUrl) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View in Dashboard',
      },
      action_id: SlackActionIds.VIEW_DASHBOARD,
      url: params.dashboardUrl,
    });
  }

  blocks.push({
    type: 'actions',
    elements: actionElements,
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Created by ${params.createdBy} \u00b7 <!date^${ts}^{date}|now>`,
      },
    ],
  });

  return {
    text: `New link created: ${params.linkUrl}`,
    blocks,
  };
}
