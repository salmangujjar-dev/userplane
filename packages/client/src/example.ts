/**
 * Usage examples for the Userplane API client
 *
 * This file demonstrates various ways to use the type-safe client
 */

import { createClient } from './index';
import type { UserplaneClient } from './index';

/**
 * Example 1: Basic client creation
 */
export function createBasicClient() {
  const client = createClient({
    url: 'http://localhost:3000/api/v2',
  });

  return client;
}

/**
 * Example 2: Client with static authentication
 */
export function createAuthenticatedClient(token: string) {
  const client = createClient({
    url: 'http://localhost:3000/api/v2',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return client;
}

/**
 * Example 3: Client with dynamic authentication
 */
export function createDynamicAuthClient() {
  const client = createClient({
    url: 'http://localhost:3000/api/v2',
    headers: ({ context }): Record<string, string> => {
      const token = context?.headers?.['authorization'];
      if (token) {
        return { Authorization: token };
      }
      return {};
    },
  });

  return client;
}

/**
 * Example 4: Client with error handling
 */
export function createClientWithErrorHandling() {
  const client = createClient({
    url: 'http://localhost:3000/api/v2',
    onError: (error) => {
      console.error('API Error occurred:', error);
    },
  });

  return client;
}

/**
 * Example 5: Using the client to get session
 */
export async function getSession(client: UserplaneClient, token: string) {
  try {
    const session = await client.session.init({
      token,
    });

    console.log('Session retrieved:', session);
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    throw error;
  }
}

/**
 * Example 6: Upload initialization with context
 */
export async function initUpload(client: UserplaneClient, authToken: string) {
  const upload = await client.session.upload.init(
    {
      recording_duration: 120000,
      files: [
        {
          name: 'recording.webm',
          type: 'video',
          size: 1024000,
          mime_type: 'video/webm',
        },
      ],
      metadata: {
        systemMetadata: {
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          browser: 'Chrome',
          os: 'Windows',
          windowSize: {
            width: 1920,
            height: 1080,
          },
        },
      },
    },
    {
      context: {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      },
    }
  );

  return upload;
}

/**
 * Example 7: Browser environment with lazy URL
 */
export function createBrowserClient() {
  const client = createClient({
    url: () => {
      if (typeof window === 'undefined') {
        throw new Error('Client must be used in browser environment');
      }
      return `${window.location.origin}/api/v2`;
    },
    credentials: 'include',
  });

  return client;
}

/**
 * Example 8: Client with custom fetch for request logging
 */
export function createClientWithLogging() {
  const client = createClient({
    url: 'http://localhost:3000/api/v2',
    fetch: async (request, init) => {
      const url = typeof request === 'string' ? request : request.url;
      console.log(`[API] ${init?.method || 'GET'} ${url}`);

      const response = await globalThis.fetch(request, init);

      console.log(`[API] ${response.status} ${url}`);
      return response;
    },
  });

  return client;
}

/**
 * Example 9: Production client configuration
 */
export function createProductionClient(config: {
  apiUrl: string;
  getAuthToken: () => string | null;
}) {
  const client = createClient({
    url: config.apiUrl,
    headers: (): Record<string, string> => {
      const token = config.getAuthToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    },
    credentials: 'include',
    onError: (error) => {
      console.error('Production API Error:', error);
    },
  });

  return client;
}
