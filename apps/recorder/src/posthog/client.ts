import posthog from 'posthog-js';

import { env } from '@/env';

let initialized = false;

export function initPostHog(): void {
  if (initialized || !env.posthog.apiKey) return;

  posthog.init(env.posthog.apiKey, {
    api_host: env.posthog.host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      blockSelector: '.ph-no-capture',
      recordHeaders: false,
      recordBody: false,
      maskCapturedNetworkRequestFn: (request) => {
        if (request.requestHeaders) {
          delete request.requestHeaders['Authorization'];
          delete request.requestHeaders['authorization'];
          delete request.requestHeaders['x-userplane-session-token'];
          delete request.requestHeaders['x-userplane-upload-token'];
        }
        return request;
      },
    },
  });

  posthog.register({ app: 'recorder' });
  initialized = true;
}

export { posthog };
