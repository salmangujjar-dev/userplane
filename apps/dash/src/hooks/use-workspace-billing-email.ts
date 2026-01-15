import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleQueryResult, type SafeResult } from '@/lib/errors';

export interface WorkspaceBillingEmailData {
  workspaceId: string;
  workspaceBillingEmail: string | null;
}

/**
 * Hook to fetch workspace billing email
 * Returns the billing email
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceBillingEmail(options?: { enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { enabled = true } = options || {};

  return useQuery<SafeResult<WorkspaceBillingEmailData>>({
    queryKey: ['workspace-billing-email', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.getWorkspaceBillingEmail({
        params: { workspaceId },
      });

      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
