/**
 * API Module for Recorder (Astro)
 * Uses the shared @workspace/api-client package
 */

import { createApi } from '@workspace/api-client';

const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create API client instance
 */
export const api = createApi({
  baseUrl: apiUrl,
  credentials: false, // Recorder might not need auth
});

/**
 * Helper to fetch users
 */
export async function fetchUsers() {
  const res = await api.users.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  return await res.json();
}
