/**
 * Home Tab - Connected View
 * Home tab shown when the user's Slack workspace is connected to Userplane
 * and the user is a recognised workspace member.
 *
 * Clean dashboard layout: Recording Link section (with Create Link),
 * Recent Recordings, and Recent Links.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';

export interface HomeRecordingItem {
  title: string;
  projectName: string;
  creatorName: string;
  durationFormatted: string;
  /** Unix timestamp in seconds for Slack date formatting */
  createdAtTs: number;
  thumbnailUrl: string | null;
}

export interface HomeLinkItem {
  linkId: string;
  title: string;
  projectName: string;
  creatorName: string;
  /** Unix timestamp in seconds for Slack date formatting */
  createdAtTs: number;
  linkUrl: string;
  workspaceId: string;
}

/**
 * Build the home tab view for connected users.
 */
export function buildHomeConnectedView(params: {
  workspaceName: string;
  workspaceId: string;
  dashboardUrl: string;
  recordings: HomeRecordingItem[];
  links: HomeLinkItem[];
}) {
  const blocks: Array<Record<string, unknown>> = [];

  // --- Recording Link ---
  blocks.push(
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recording Link' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Create a recording link and share it with anyone.',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Create Link' },
        action_id: SlackActionIds.CREATE_LINK,
        style: 'primary',
      },
    },
    { type: 'divider' }
  );

  // --- Recent Recordings ---
  blocks.push(
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recent Recordings' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Screen recordings submitted by your team.',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'View All' },
        action_id: SlackActionIds.BROWSE_RECORDINGS,
      },
    }
  );

  if (params.recordings.length > 0) {
    for (const rec of params.recordings.slice(0, 3)) {
      const block: Record<string, unknown> = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${rec.title} Recording*\nRequested by ${rec.creatorName} \u00b7 ${rec.durationFormatted} \u00b7 <!date^${rec.createdAtTs}^{date_short_pretty}|${new Date(rec.createdAtTs * 1000).toLocaleDateString()}>`,
        },
      };

      if (rec.thumbnailUrl) {
        block.accessory = {
          type: 'image',
          image_url: rec.thumbnailUrl,
          alt_text: 'Recording thumbnail',
        };
      }

      blocks.push(block);
    }
  } else {
    blocks.push({
      type: 'context',
      elements: [{ type: 'plain_text', text: 'No recordings yet.' }],
    });
  }

  blocks.push({ type: 'divider' });

  // --- Recent Links ---
  blocks.push(
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recent Links' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Recording links shared with your team.',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'View All' },
        action_id: SlackActionIds.BROWSE_LINKS,
      },
    }
  );

  if (params.links.length > 0) {
    for (const link of params.links.slice(0, 3)) {
      const viewUrl = slackCanvasUrls.linkRecordingsUrl(link.workspaceId, link.linkId);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${link.title}*\nCreated by ${link.creatorName} \u00b7 <!date^${link.createdAtTs}^{date_short_pretty}|${new Date(link.createdAtTs * 1000).toLocaleDateString()}>`,
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View Recording' },
          action_id: SlackActionIds.VIEW_RECORDING,
          url: viewUrl,
        },
      });
    }
  } else {
    blocks.push({
      type: 'context',
      elements: [{ type: 'plain_text', text: 'No recording links yet.' }],
    });
  }

  return {
    type: 'home' as const,
    blocks,
  };
}
