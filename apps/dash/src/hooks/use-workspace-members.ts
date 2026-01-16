import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleQueryResult } from '@/lib/errors';
import { DEFAULT_MEMBERS_PER_PAGE } from '@/constants/pagination';

export interface WorkspaceMember {
  workspaceMemberId: string;
  memberName: string;
  memberEmail: string;
  workspaceRole: 'owner' | 'admin' | 'member';
}

/**
 * Hook to fetch workspace members
 * Returns all members in the workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function MembersFilter() {
 *   const { data, isLoading } = useWorkspaceMembers();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <select>
 *       {data.data.map(member => (
 *         <option key={member.workspaceMemberId} value={member.workspaceMemberId}>
 *           {member.memberName}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useWorkspaceMembers(options?: {
  perPage?: number;
  page?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_MEMBERS_PER_PAGE, page = 1, enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspace-members', workspaceId, perPage, page],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.list({
        params: { workspaceId },
        query: {
          page: options?.page || 1,
          per_page: perPage,
        },
      });

      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
