import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_WORKSPACES_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to fetch all workspaces for the current user
 * Returns list of workspaces with optional membership information
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
  includeWorkspaceMembership?: boolean;
  enabled?: boolean;
}) {
  const {
    page = 1,
    perPage = DEFAULT_WORKSPACES_PER_PAGE,
    includeWorkspaceMembership = true,
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: ['workspaces', page, perPage, includeWorkspaceMembership],
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.list({
        query: {
          page,
          per_page: perPage,
          include_workspace_membership: includeWorkspaceMembership,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
