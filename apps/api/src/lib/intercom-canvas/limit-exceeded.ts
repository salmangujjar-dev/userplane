/**
 * Limit Exceeded Canvas Builder
 * Shown when the workspace has exceeded its recording/link limits
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { getCanvasImages, intercomCanvasUrls } from './urls';

export interface LimitExceededCanvasOptions {
  workspaceId: string;
  limitType?: 'recordings' | 'links';
}

/**
 * Build the limit exceeded canvas
 * Shown when workspace has exceeded plan limits
 * Features centered upgrade icon and clear upgrade path
 */
export function buildLimitExceededCanvas(options: LimitExceededCanvasOptions): Canvas {
  const upgradeUrl = intercomCanvasUrls.upgradeWorkspaceURL(options.workspaceId);
  const limitDescription =
    options.limitType === 'links'
      ? "You've reached the maximum number of recording links for your workspace."
      : "You've reached the maximum number of recordings for your workspace.";

  return {
    content: {
      components: [
        {
          type: 'image',
          id: 'icon',
          url: getCanvasImages().limitExceededUpgrade,
          align: 'center',
          width: 50,
          height: 50,
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'text',
          id: 'header',
          text: '*Limit Reached*',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'text',
          id: 'description',
          text: limitDescription,
          style: 'muted',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 'xs',
        },
        {
          type: 'text',
          id: 'upgrade_prompt',
          text: 'Upgrade your workspace to continue creating recording links.',
          style: 'muted',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'upgrade',
          label: 'Upgrade Workspace',
          style: 'primary',
          action: {
            type: 'url',
            url: upgradeUrl,
          },
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
