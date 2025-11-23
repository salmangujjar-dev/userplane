/**
 * API Module for Home (Astro)
 * Uses the shared @workspace/api-client package
 */

import apiClient from '@workspace/api-client';

const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create API client instance
 */
export const api = apiClient(apiUrl);

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

/**
 * Helper to fetch user by ID
 */
export async function fetchUser(id: string) {
  const res = await api.users[':id'].$get({
    param: { id },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }

  return await res.json();
}
