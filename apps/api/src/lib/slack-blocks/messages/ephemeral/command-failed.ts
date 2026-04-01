/**
 * Command Failed Ephemeral
 * Shown when the slash command or block action fails to open a modal.
 * Includes a dashboard fallback link when workspaceId is available.
 */

import { SlackActionIds } from '../../constants';
import { slackCanvasUrls } from '../../urls';
import { buildErrorEphemeral } from './error';

/**
 * Build an ephemeral error for when the modal could not be opened.
 * @param params.workspaceId - if provided, adds a "Create from Dashboard" fallback button
 * @param params.retryHint - contextual hint for how the user should retry
 */
export function buildCommandFailedMessage(params?: { workspaceId?: string; retryHint?: string }) {
  const retryHint = params?.retryHint ?? 'Please run `/userplane` again.';

  return buildErrorEphemeral({
    heading: 'Could not open the form',
    description: `Something went wrong opening the link creation form. ${retryHint}`,
    actions: params?.workspaceId
      ? [
          {
            text: 'Create from Dashboard',
            actionId: SlackActionIds.VIEW_DASHBOARD,
            url: slackCanvasUrls.createLinkUrl(params.workspaceId),
          },
        ]
      : undefined,
  });
}
