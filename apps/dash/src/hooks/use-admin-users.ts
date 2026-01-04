'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { authClient } from '@/client/auth';

interface UseAdminUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string | null;
  createdAt?: Date;
  banned?: boolean | null;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching users as an admin.
 * Uses the Better Auth admin listUsers API.
 */
export function useAdminUsers({
  search = '',
  limit = 20,
  offset = 0,
  enabled = true,
}: UseAdminUsersParams = {}): UseQueryResult<AdminUsersResponse | null, Error> {
  return useQuery({
    queryKey: ['admin-users', { search, limit, offset }],
    queryFn: async (): Promise<AdminUsersResponse | null> => {
      const result = await authClient.admin.listUsers({
        query: {
          limit,
          offset,
          ...(search
            ? {
                searchValue: search,
                searchField: 'email' as const,
                searchOperator: 'contains' as const,
              }
            : {}),
          sortBy: 'createdAt',
          sortDirection: 'desc' as const,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch users');
      }

      return result.data as AdminUsersResponse | null;
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}
