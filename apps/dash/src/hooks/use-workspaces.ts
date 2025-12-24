import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { handleQueryResult } from '@/lib/errors';

/**
 * Hook to fetch all workspaces for the current user
 * Returns list of workspaces with optional notification preferences and membership
 * Supports minimal mode for efficient loading (only ID and name)
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function WorkspaceList() {
 *   const { data, isLoading } = useWorkspaces();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <div>
 *       {data.data.workspaces.map(workspace => (
 *         <div key={workspace.workspaceId}>{workspace.workspaceName}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkspaces(options?: {
  page?: number;
  perPage?: number;
  minimal?: boolean;
  enabled?: boolean;
}) {
  const { page = 1, perPage = 100, minimal = false, enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspaces', page, perPage, minimal],
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.list({
        query: {
          page,
          minimal,
          include_notification_preference: !minimal,
          include_workspace_membership: !minimal,
        },
      });
      return handleQueryResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
