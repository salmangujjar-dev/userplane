/**
 * Home Tab — Connected View
 * Rich home tab shown when the user's Slack workspace is connected to Userplane
 * and the user is a recognised workspace member.
 */

import { SlackActionIds } from './constants';
import { getSlackCanvasImages, slackCanvasUrls } from './urls';

/**
 * Build the home tab view for connected users.
 * Shows workspace info, a "Create Link" action, and a "View Recordings" link.
 */
export function buildHomeTabConnectedView(params: {
  workspaceName: string;
  /** Workspace ID — used to build recordings and dashboard URLs */
  workspaceId?: string;
  /** Workspace member ID — used to build the "View Recordings" link filtered by creator */
  workspaceMemberId?: string;
  /** @deprecated Provide workspaceId instead; kept for backward compatibility */
  dashboardUrl?: string;
}) {
  const recordingsUrl =
    params.workspaceId && params.workspaceMemberId
      ? slackCanvasUrls.userRecordingsUrl(params.workspaceId, params.workspaceMemberId)
      : params.workspaceId
        ? slackCanvasUrls.recordingsUrl(params.workspaceId)
        : (params.dashboardUrl ?? slackCanvasUrls.dashboardUrl());
  const dashboardUrl = params.dashboardUrl ?? slackCanvasUrls.dashboardUrl();

  const images = getSlackCanvasImages();

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
          text: 'Welcome to Userplane',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Workspace:* ${params.workspaceName}\nYour Slack workspace is connected to Userplane. Create recording links and manage recordings right from Slack.`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Link',
            },
            action_id: SlackActionIds.CREATE_LINK,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Recordings',
            },
            action_id: SlackActionIds.VIEW_RECORDINGS,
            url: recordingsUrl,
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
            text: `Userplane \u00b7 <${dashboardUrl}|Open Dashboard>`,
          },
        ],
      },
    ],
  };
}
