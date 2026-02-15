'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import type { CacheType } from '@/types';

interface ClearServerCacheInput {
  workspaceId: string;
  types: CacheType[];
}

/**
 * Hook to clear workspace server cache
 * Supports granular cache type selection
 */
export function useClearServerCache() {
  return useMutation({
    mutationFn: async ({ workspaceId, types }: ClearServerCacheInput) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      if (types.length === 0) {
        throw new Error('At least one cache type must be selected');
      }

      const [error, response] = await apiClient.diagnostics.runDiagnostics({
        params: { workspaceId },
        body: {
          action: 'clear-cache',
          payload: { types },
        },
      });

      if (error) {
        throw error;
      }

      return response;
    },
    // Toast handling moved to component using toast.promise
  });
}

/**
 * Hook to clear client-side cache
 * Does not make an API call, just clears the local query cache
 */
export function useClearClientCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      queryClient.clear();
      return { success: true };
    },
    // Toast handling moved to component using toast.promise
  });
}
