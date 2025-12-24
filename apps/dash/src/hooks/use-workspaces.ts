import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';

/**
 * Hook to fetch all workspaces for the current user
 * Returns list of workspaces with notification preferences and membership
 *
 * @example
 * ```tsx
 * function WorkspaceList() {
 *   const { data, isLoading } = useWorkspaces();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {data?.workspaces.map(workspace => (
 *         <div key={workspace.workspaceId}>{workspace.workspaceName}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkspaces(options?: { page?: number; perPage?: number; enabled?: boolean }) {
  const { page = 1, perPage = 100, enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspaces', page, perPage],
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.list({
        query: {
          page,
          include_notification_preference: true,
          include_workspace_membership: true,
        },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
