/**
 * API Client for Recorder
 *
 * Type-safe client for interacting with the Userplane API
 */

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

      return `${window.location.origin}/api/v2`;
    },
    headers: ({ context }) => {
      console.log('[API Client] Building headers with context:', context?.headers);
      return context?.headers || {};
    },
    credentials: 'include',
    onError: (error) => {
      console.error('[API Client] Error:', error);
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
