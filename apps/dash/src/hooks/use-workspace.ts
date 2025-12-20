import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

/**
 * Hook to fetch workspace information
 * Returns workspace details including name and settings
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
      if (error) throw error;
      return response.data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
