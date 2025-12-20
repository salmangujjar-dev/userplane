import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

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
 * @example
 * ```tsx
 * function MembersFilter() {
 *   const { data: members, isLoading } = useWorkspaceMembers();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <select>
 *       {members?.map(member => (
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
  includeMe?: boolean;
  perPage?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { includeMe = false, perPage = 5, enabled = true } = options || {};

  return useQuery({
    queryKey: ['workspace-members', workspaceId, includeMe, perPage],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.list({
        params: { workspaceId },
        query: {
          page: 1,
          per_page: perPage,
          include_me: includeMe,
        },
      });

      if (error) throw error;
      return response.data.workspaceMembers as WorkspaceMember[];
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
