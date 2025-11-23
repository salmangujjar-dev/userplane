/**
 * API Module - Type-safe API calls using Hono RPC
 * Uses the shared @workspace/api-client package
 */

import { createApi } from '@workspace/api-client';
import { env } from './env';

/**
 * Create API client instance with configuration
 */
export const api = createApi({
  baseUrl: env.api.url,
  credentials: true,
});

/**
 * Users API
 * Type-safe user management methods
 */
export const users = {
  /**
   * List all users
   */
  list: async () => {
    const res = await api.users.$get();
    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    return await res.json();
  },

  /**
   * Get user by ID
   */
  get: async (id: string) => {
    const res = await api.users[':id'].$get({
      param: { id },
    });

    if (res.status === 404) {
      const error = await res.json();
      throw new Error(error.error);
    }

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }

    return await res.json();
  },

  /**
   * Create new user
   */
  create: async (data: { name: string; email: string; role?: 'admin' | 'user' }) => {
    const res = await api.users.$post({
      json: data,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error('message' in error ? error.message : 'Failed to create user');
    }

    return await res.json();
  },

  /**
   * Update user
   */
  update: async (id: string, data: { name?: string; email?: string; role?: 'admin' | 'user' }) => {
    const res = await api.users[':id'].$put({
      param: { id },
      json: data,
    });

    if (res.status === 404) {
      const error = await res.json();
      throw new Error(error.error);
    }

    if (!res.ok) {
      throw new Error('Failed to update user');
    }

    return await res.json();
  },

  /**
   * Delete user
   */
  delete: async (id: string) => {
    const res = await api.users[':id'].$delete({
      param: { id },
    });

    if (res.status === 404) {
      const error = await res.json();
      throw new Error(error.error);
    }

    if (!res.ok) {
      throw new Error('Failed to delete user');
    }

    return await res.json();
  },
};
