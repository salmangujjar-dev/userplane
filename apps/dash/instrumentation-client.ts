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
    capture_pageview: true,
    capture_pageleave: true,
  });
}
