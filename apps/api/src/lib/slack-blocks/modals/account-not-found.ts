/**
 * Account Not Found Modal
 * Shown when the Slack user has no linked Userplane account.
 */

import { SlackActionIds } from '../constants';
import { slackCanvasUrls } from '../urls';
import { buildErrorModalView } from './error';

export function buildAccountNotFoundModalView(params?: { email?: string }) {
  const emailHint = params?.email ? ` (\`${params.email}\`)` : '';

  return buildErrorModalView({
    title: 'Account not found',
    heading: 'No Userplane account found',
    description: `Your Slack account${emailHint} isn\u2019t linked to Userplane. Sign up to get started.`,
    actions: [
      {
        text: 'Sign Up',
        actionId: SlackActionIds.VIEW_DASHBOARD,
        url: slackCanvasUrls.signUpUrl(),
        style: 'primary',
      },
    ],
  });
}
