/**
 * Access Denied Modal
 * Shown when the user loses access during an in-progress operation.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { buildErrorModalView } from './error';

export function buildAccessDeniedModalView() {
  return buildErrorModalView({
    title: 'Access denied',
    heading: 'You don\u2019t have access to this workspace',
    description:
      'Your access may have been removed. Request an invite from a workspace admin to get back in.',
    actions: [
      {
        text: 'Request Access',
        actionId: SlackActionIds.REQUEST_ACCESS,
        url: slackCanvasUrls.workspaceSuggestUrl(),
        style: 'primary',
      },
    ],
  });
}
