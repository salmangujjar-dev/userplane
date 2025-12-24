import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import { handleApiError, handleSafeResult, isErrorCode } from '@/lib/errors';
import type { WorkspaceMember } from '@/hooks/use-workspace-members';

export function useUpdateMemberRole(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceMemberId,
      newRole,
    }: {
      workspaceMemberId: string;
      newRole: 'admin' | 'member';
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.members.updateRole({
        params: { workspaceId, workspaceMemberId },
        body: { role: newRole },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({
      workspaceMemberId,
      newRole,
    }: {
      workspaceMemberId: string;
      newRole: 'admin' | 'member';
    }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-members', workspaceId] });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>([
        'workspace-members',
        workspaceId,
      ]);

      queryClient.setQueryData(
        ['workspace-members', workspaceId],
        (old: WorkspaceMember[] | undefined) => {
          if (!old) return old;
          return old.map((member) =>
            member.workspaceMemberId === workspaceMemberId
              ? { ...member, workspaceRole: newRole }
              : member
          );
        }
      );

      return { previousMembers };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback optimistic update
        if (context?.previousMembers) {
          queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
        }
        // Handle specific role change errors
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE')) {
          toast.error("Can't change your own role");
          return;
        }
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE')) {
          toast.error("Can't demote the last owner", {
            description: 'Promote another member to owner first.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to update member role');
        return;
      }
      toast.success('Member role updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback optimistic update for unknown errors
      if (context?.previousMembers) {
        queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
      }
      // Only unknown errors reach here
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
  });
}

export function useRemoveMember(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceMemberId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.members.remove({
        params: { workspaceId, workspaceMemberId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (workspaceMemberId: string) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-members', workspaceId] });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>([
        'workspace-members',
        workspaceId,
      ]);

      queryClient.setQueryData(
        ['workspace-members', workspaceId],
        (old: WorkspaceMember[] | undefined) => {
          if (!old) return old;
          return old.filter((member) => member.workspaceMemberId !== workspaceMemberId);
        }
      );

      return { previousMembers };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback optimistic update
        if (context?.previousMembers) {
          queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
        }
        // Handle specific member removal errors
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_CANNOT_REMOVE_SELF')) {
          toast.error("Can't remove yourself", {
            description: 'Use leave workspace instead.',
          });
          return;
        }
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_LAST_OWNER_REMOVE')) {
          toast.error("Can't remove the last owner");
          return;
        }
        handleApiError(result.error, 'Failed to remove member');
        return;
      }
      toast.success('Member removed successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback optimistic update for unknown errors
      if (context?.previousMembers) {
        queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
      }
      // Only unknown errors reach here
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
  });
}
