import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

export type WorkspaceInvitePolicy = 'private' | 'whitelisted' | 'protected';

export interface InvitePolicyData {
  workspaceId: string;
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  workspaceInviteDomains: string[] | null;
}

/**
 * Hook to fetch workspace invite policy
 * Returns the invite policy and allowed domains
 *
 * Returns SafeResult - check result.success before using data
 */
export function useInvitePolicy(options?: { enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspace-invite-policy', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.invitePolicy.get({
        params: { workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
