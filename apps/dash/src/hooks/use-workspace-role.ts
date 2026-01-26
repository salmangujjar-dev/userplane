import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface WorkspaceMembership {
  workspaceMemberId: string;
  workspaceRole: WorkspaceRole;
  workspaceJoinedAt: Date;
}

/**
 * Hook to fetch the current user's workspace role
 * Returns the current user's role in the workspace (owner, admin, or member)
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function RestrictedSection() {
 *   const { data: roleResult, isLoading } = useWorkspaceRole();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (roleResult && !roleResult.success) {
 *     return <ErrorState error={roleResult.error} />;
 *   }
 *
 *   const role = roleResult.data.workspaceRole;
 *   const canEdit = role === 'owner' || role === 'admin';
 *
 *   return (
 *     <Button disabled={!canEdit}>Edit Settings</Button>
 *   );
 * }
 * ```
 */
export function useWorkspaceRole() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['workspace-role', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.getMembership({
        params: { workspaceId },
      });

      const responseData = response?.data as
        | {
            workspaceId: string;
            workspaceMembership: WorkspaceMembership;
          }
        | undefined;

      const membership = responseData?.workspaceMembership;

      if (!membership) {
        throw new Error('Unable to retrieve workspace membership');
      }

      return handleSafeResult(error, membership);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Helper hook that returns whether the current user can edit workspace settings
 * Returns true if user is owner or admin, false otherwise
 */
export function useCanEditWorkspace() {
  const { data: roleResult, isLoading } = useWorkspaceRole();

  const canEdit =
    roleResult?.success &&
    (roleResult.data.workspaceRole === 'owner' || roleResult.data.workspaceRole === 'admin');

  return {
    canEdit: canEdit || false,
    isLoading,
    role: roleResult?.success ? roleResult.data.workspaceRole : null,
  };
}
