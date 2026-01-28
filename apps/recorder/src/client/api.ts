/**
 * API Client for Recorder
 *
 * Type-safe client for interacting with the Userplane API
 */

import * as Sentry from '@sentry/astro';
import { createClient, createSafeClient } from '@workspace/client';

/**
 * Create a client instance for the recorder
 * Uses lazy URL evaluation to work in browser environment
 */
export function createRecorderClient() {
  const baseClient = createClient({
    url: () => {
      if (typeof window === 'undefined') {
        throw new Error('Recorder client must be used in browser environment');
      }

      const apiUrl = import.meta.env.PUBLIC_API_URL;
      if (apiUrl) {
        return apiUrl;
      }

      return `${window.location.origin}/api/1`;
    },
    headers: ({ context }) => {
      console.log('[API Client] Building headers with context:', context?.headers);
      return context?.headers || {};
    },
    credentials: 'include',
    onError: (error) => {
      console.error('[API Client] Error:', error);

      // Capture API errors in Sentry with context
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          error_type: 'api_client_error',
          error_source: 'recorder_api_client',
        },
        contexts: {
          api: {
            // @ts-expect-error - error may have these properties
            endpoint: error.endpoint || 'unknown',
            // @ts-expect-error - error may have these properties
            method: error.method || 'unknown',
            // @ts-expect-error - error may have these properties
            status: error.status || 0,
            // @ts-expect-error - error may have these properties
            statusText: error.statusText || '',
          },
        },
      });
    },
  });

  return createSafeClient(baseClient);
}

/**
 * Get or create a singleton client instance
 */
let clientInstance: ReturnType<typeof createRecorderClient> | null = null;

export function getRecorderClient() {
  if (!clientInstance) {
    clientInstance = createRecorderClient();
  }
  return clientInstance;
}
