import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch a single project by ID
 * Returns project details including title and settings
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
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
      return handleSafeResult(error, response?.data.project ?? null);
    },
    enabled: enabled && !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
