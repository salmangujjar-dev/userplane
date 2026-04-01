/**
 * Setup Incomplete Modal
 * Shown when the workspace has no projects or domains configured.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { buildErrorModalView } from './error';

export function buildSetupIncompleteModalView() {
  return buildErrorModalView({
    title: 'Setup incomplete',
    heading: 'Your workspace isn\u2019t set up yet',
    description:
      'Create a project and add a domain in the dashboard before creating recording links.',
    actions: [
      {
        text: 'Open Dashboard',
        actionId: SlackActionIds.VIEW_DASHBOARD,
        url: slackCanvasUrls.dashboardUrl(),
        style: 'primary',
      },
    ],
  });
}
