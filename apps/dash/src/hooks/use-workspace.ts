import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch workspace information
 * Returns workspace details including name and settings
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspace() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.getById({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
