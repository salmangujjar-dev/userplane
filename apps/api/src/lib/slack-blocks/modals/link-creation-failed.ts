/**
 * Link Creation Failed Modal
 * Shown when link creation fails unexpectedly.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { buildErrorModalView } from './error';

export function buildLinkCreationFailedModalView(params?: { workspaceId?: string }) {
  return buildErrorModalView({
    title: 'Link creation failed',
    heading: 'Something went wrong',
    description:
      'We couldn\u2019t create your recording link. Close this dialog and run `/userplane` to try again.',
    actions: params?.workspaceId
      ? [
          {
            text: 'Create from Dashboard',
            actionId: SlackActionIds.VIEW_DASHBOARD,
            url: slackCanvasUrls.createLinkUrl(params.workspaceId),
            style: 'primary',
          },
        ]
      : undefined,
  });
}
