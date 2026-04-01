/**
 * Workspace Not Connected Ephemeral
 * Shown when the slash command is used in an unconnected Slack workspace.
 */

import { SlackActionIds } from '../../constants';
import { slackCanvasUrls } from '../../urls';
import { buildErrorEphemeral } from './error';

export function buildWorkspaceNotConnectedMessage() {
  const dashboardUrl = slackCanvasUrls.dashboardUrl();
  const connectUrl = `${dashboardUrl}/_/settings?tab=integrations`;
  const createUrl = `${dashboardUrl}/workspace/create?flow=slack`;

  return buildErrorEphemeral({
    heading: 'Workspace not connected',
    description:
      "This Slack workspace isn't connected to Userplane yet. Connect an existing workspace or create a new one to get started.",
    actions: [
      {
        text: 'Connect Workspace',
        actionId: SlackActionIds.CONNECT_WORKSPACE,
        url: connectUrl,
        style: 'primary',
      },
      {
        text: 'Create Workspace',
        actionId: SlackActionIds.CREATE_WORKSPACE,
        url: createUrl,
      },
    ],
  });
}
