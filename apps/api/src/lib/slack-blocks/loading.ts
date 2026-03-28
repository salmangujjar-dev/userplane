/**
 * Loading Modal
 * Lightweight placeholder modal opened immediately to consume the
 * short-lived trigger_id. The view is replaced via views.update once
 * async work (access verification, data fetching) completes.
 */

import { getRandomLoadingGifUrl } from './urls';

/**
 * Build a loading modal with a random animated GIF.
 * Keeping it generic so it can front any slash-command, block-action,
 * or view-submission flow that needs time to resolve.
 */
export function buildLoadingModal(message = 'Almost there - setting things up for you...') {
  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Userplane',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: message },
        level: 4,
      },
      {
        type: 'image',
        image_url: getRandomLoadingGifUrl(),
        alt_text: 'Loading',
      },
    ],
  };
}
