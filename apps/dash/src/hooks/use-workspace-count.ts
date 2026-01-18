import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch workspace count for current user
 * Returns the count of workspaces the user is a member of
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceCount() {
  return useQuery({
    queryKey: ['workspace', 'count'],
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.count({
        query: {},
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
}
