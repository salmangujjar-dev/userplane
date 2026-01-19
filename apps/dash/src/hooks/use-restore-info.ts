import { useQuery } from '@tanstack/react-query';
import type { ProjectRestoreInfoData, WorkspaceRestoreInfoData } from '@workspace/contract';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch workspace restore information
 * Returns details about a deleted workspace that can be restored
 */
export function useWorkspaceRestoreInfo(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-restore-info', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID provided');
      }
      const [error, response] = await apiClient.workspace.getRestoreInfo({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    retry: false,
  });
}

/**
 * Hook to fetch project restore information
 * Returns details about a deleted project that can be restored
 */
export function useProjectRestoreInfo(workspaceId: string | null, projectId: string | null) {
  return useQuery({
    queryKey: ['project-restore-info', workspaceId, projectId],
    queryFn: async () => {
      if (!workspaceId || !projectId) {
        throw new Error('Workspace ID and Project ID are required');
      }
      const [error, response] = await apiClient.project.getRestoreInfo({
        params: { workspaceId, projectId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!projectId,
    retry: false,
  });
}

// Re-export types from contract for convenience
export type { ProjectRestoreInfoData, WorkspaceRestoreInfoData };
