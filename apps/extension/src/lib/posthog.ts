import { PostHog } from 'posthog-js/dist/module.no-external';

// Side-effect plugin imports (exception-autocapture, posthog-recorder) are loaded
// dynamically inside initPostHogUI() — they reference DOM APIs (window.onerror etc.)
// and must NOT run in the background service worker context.

const POSTHOG_KEY = import.meta.env.WXT_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.WXT_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogInstance: PostHog | null = null;

async function getOrCreateDistinctId(): Promise<string> {
  const stored = await chrome.storage.local.get(['posthog_distinct_id']);
  if (stored.posthog_distinct_id) return stored.posthog_distinct_id as string;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ posthog_distinct_id: id });
  return id;
}

/**
 * Initialize PostHog for UI contexts (side panel, options page).
 * Uses localStorage persistence and enables session replay with privacy protections.
 */
export async function initPostHogUI(): Promise<PostHog | null> {
  if (posthogInstance) return posthogInstance;
  if (!POSTHOG_KEY) return null;

  // Load UI-only plugins before init — these register on __PosthogExtensions__
  // and must not load in the service worker (they access window.onerror etc.)
  await import('posthog-js/dist/posthog-recorder');
  await import('posthog-js/dist/exception-autocapture');

  const distinctId = await getOrCreateDistinctId();
  const posthog = new PostHog();

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    persistence: 'localStorage',
    bootstrap: { distinctID: distinctId },
    disable_external_dependency_loading: true,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    enable_recording_console_log: true,
    error_tracking: {
      captureExtensionExceptions: true,
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      blockSelector: '.ph-no-capture',
      recordHeaders: false,
      recordBody: false,
      captureCanvas: {
        recordCanvas: false,
      },
      maskCapturedNetworkRequestFn: (request) => {
        if (request.requestHeaders) {
          delete request.requestHeaders['Authorization'];
          delete request.requestHeaders['authorization'];
        }
        return request;
      },
    },
  });

  posthog.register({ app: 'extension' });
  posthogInstance = posthog;
  return posthog;
}

/**
 * Initialize PostHog for the background service worker.
 * Uses memory persistence (localStorage unavailable in service workers).
 * No session recording, autocapture, or pageview tracking.
 */
export async function initPostHogBackground(): Promise<PostHog | null> {
  if (posthogInstance) return posthogInstance;
  if (!POSTHOG_KEY) return null;

  const distinctId = await getOrCreateDistinctId();
  const posthog = new PostHog();

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    persistence: 'memory',
    bootstrap: { distinctID: distinctId },
    disable_external_dependency_loading: true,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
  });

  posthog.register({ app: 'extension' });
  posthogInstance = posthog;
  return posthog;
}

/**
 * Get the current PostHog instance. Returns null if not initialized or API key missing.
 * Use optional chaining: `getPostHog()?.captureException(error, props)`
 */
export function getPostHog(): PostHog | null {
  return posthogInstance;
}
