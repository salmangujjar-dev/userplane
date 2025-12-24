import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleQueryResult } from '@/lib/errors';

/**
 * Hook to fetch notification preferences for the current workspace
 * Returns notification settings for the current user in the workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceNotifications() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['workspace-notifications', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.notifications.get({
        params: { workspaceId },
      });
      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
