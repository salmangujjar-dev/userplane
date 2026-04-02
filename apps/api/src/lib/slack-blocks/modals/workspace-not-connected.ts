/**
 * Workspace Not Connected Modal
 * Shown when the Slack workspace has no Userplane integration.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { buildErrorModalView } from './error';

export function buildWorkspaceNotConnectedModalView() {
  return buildErrorModalView({
    title: 'Not connected',
    heading: 'Workspace not connected',
    description:
      'This Slack workspace isn\u2019t connected to Userplane yet. Connect it from your dashboard to get started.',
    actions: [
      {
        text: 'Connect Workspace',
        actionId: SlackActionIds.CONNECT_WORKSPACE,
        url: slackCanvasUrls.slackAuthorizeUrl(),
        style: 'primary',
      },
    ],
  });
}
