import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

/**
 * Hook to fetch a single project by ID
 * Returns project details including title and settings
 */
export function useProject(projectId: string, options?: { enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.project.getById({
        params: { workspaceId, projectId },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data.project;
    },
    enabled: enabled && !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
