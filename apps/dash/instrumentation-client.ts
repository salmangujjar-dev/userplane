/**
 * Client-side instrumentation file
 * This file configures PostHog for the browser
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */
import posthog from 'posthog-js';

import { clientEnv } from '@/lib/env';

if (clientEnv.posthog.apiKey) {
  posthog.init(clientEnv.posthog.apiKey, {
    api_host: clientEnv.posthog.host,
    autocapture: false,
    enable_recording_console_log: true,
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      // Mask all text input values (email, password, search, etc.)
      maskAllInputs: true,
      // Mask all rendered text — replays show layout and click patterns but not actual content
      maskTextSelector: '*',
      // Block elements with sensitive content from being recorded at all
      blockSelector: '.ph-no-capture',
      // Don't record network request/response bodies — could contain auth tokens, customer data
      recordHeaders: false,
      recordBody: false,
      // Don't record canvas content (not needed for our dashboard)
      captureCanvas: {
        recordCanvas: false,
      },
      // Strip sensitive headers as defense-in-depth
      maskCapturedNetworkRequestFn: (request) => {
        if (request.requestHeaders) {
          delete request.requestHeaders['Authorization'];
          delete request.requestHeaders['authorization'];
        }
        return request;
      },
    },
  });

  // Register global properties so all events (including captureException) include app source
  posthog.register({ app: 'dash' });
}
