/**
 * Limit Exceeded Canvas Builder
 * Shown when the workspace has exceeded its recording/link limits
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { intercomCanvasUrls } from './urls';

export interface LimitExceededCanvasOptions {
  workspaceId: string;
  limitType?: 'recordings' | 'links';
}

/**
 * Build the limit exceeded canvas
 * Shown when workspace has exceeded plan limits
 */
export function buildLimitExceededCanvas(options: LimitExceededCanvasOptions): Canvas {
  const upgradeUrl = intercomCanvasUrls.upgradeWorkspaceURL(options.workspaceId);
  const limitDescription =
    options.limitType === 'links'
      ? "You've reached the maximum number of recording links for your plan."
      : "You've reached the maximum number of recordings for your plan.";

  return {
    content: {
      components: [
        {
          type: 'text',
          id: 'header',
          text: 'Limit Reached',
          style: 'header',
        },
        {
          type: 'text',
          id: 'description',
          text: limitDescription,
          style: 'paragraph',
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'text',
          id: 'upgrade_prompt',
          text: 'Upgrade your plan to continue creating recording links.',
          style: 'muted',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'upgrade',
          label: 'Upgrade to Pro',
          style: 'primary',
          action: {
            type: 'url',
            url: upgradeUrl,
          },
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'button',
          id: 'go_back',
          label: 'Go back',
          style: 'secondary',
          action: { type: 'submit' },
        },
      ],
    },
    stored_data: {
      flow: 'limit_exceeded',
    },
  };
}
