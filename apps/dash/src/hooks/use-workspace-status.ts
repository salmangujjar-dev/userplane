import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

export type WorkspaceInvitePolicy = 'private' | 'whitelisted' | 'protected';
export type WorkspaceAccessStatus = 'member' | 'can_join' | 'can_request' | 'no_access';

export interface WorkspaceStatusData {
  workspaceId: string;
  workspaceName: string;
  isDeleted: boolean;
  invitePolicy: WorkspaceInvitePolicy | null;
  accessStatus: WorkspaceAccessStatus;
}

/**
 * Hook to fetch workspace status and access info for current user
 * Used by WorkspaceAccessGate to determine what UI to show
 *
 * Returns:
 * - 'member' if user is already a member
 * - 'can_join' if workspace is whitelisted and domain matches
 * - 'can_request' if workspace is protected and domain matches
 * - 'no_access' if workspace is private or domain doesn't match
 *
 * Handles soft-deleted workspaces gracefully by returning isDeleted: true
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceStatus(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-status', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.status({
        params: { workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds - shorter than workspace data
    retry: 1,
  });
}
