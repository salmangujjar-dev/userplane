/**
 * API Client for Recorder
 *
 * Type-safe client for interacting with the Userplane API
 */

import { createClient } from '@workspace/client';
import type { UserplaneClient } from '@workspace/client';

/**
 * Create a client instance for the recorder
 * Uses lazy URL evaluation to work in browser environment
 */
export function createRecorderClient(): UserplaneClient {
  return createClient({
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
    credentials: 'include',
    onError: (error) => {
      console.error('[API Client] Error:', error);
    },
  });
}

/**
 * Get or create a singleton client instance
 */
let clientInstance: UserplaneClient | null = null;

export function getRecorderClient(): UserplaneClient {
  if (!clientInstance) {
    clientInstance = createRecorderClient();
  }
  return clientInstance;
}
