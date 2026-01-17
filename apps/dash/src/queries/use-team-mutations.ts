import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  isErrorCode,
  showErrorToast,
  type SafeResult,
} from '@/lib/errors';
import type { MembersListResponse, QueryData, QuerySnapshot } from '@/lib/types';

type MembersQueryData = QueryData<MembersListResponse>;

export function useUpdateMemberRole(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceMemberId,
      newRole,
    }: {
      workspaceMemberId: string;
      newRole: 'owner' | 'admin' | 'member';
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
      newRole: 'owner' | 'admin' | 'member';
    }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-members', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<MembersQueryData> =
        queryClient.getQueriesData<MembersQueryData>({
          queryKey: ['workspace-members', workspaceId],
        });

      // Update ALL matching queries
      queryClient.setQueriesData<MembersQueryData>(
        { queryKey: ['workspace-members', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaceMembers: old.data.workspaceMembers.map((member) =>
                member.workspaceMemberId === workspaceMemberId
                  ? { ...member, workspaceRole: newRole }
                  : member
              ),
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Member role updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process member operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
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

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<MembersQueryData> =
        queryClient.getQueriesData<MembersQueryData>({
          queryKey: ['workspace-members', workspaceId],
        });

      // Update ALL matching queries
      queryClient.setQueriesData<MembersQueryData>(
        { queryKey: ['workspace-members', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaceMembers: old.data.workspaceMembers.filter(
                (member) => member.workspaceMemberId !== workspaceMemberId
              ),
            },
          };
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Member removed successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process member operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
    },
  });
}
