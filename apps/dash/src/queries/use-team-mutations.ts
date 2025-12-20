import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
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
      if (error) throw error;
      return response.data;
    },
    onMutate: async ({ workspaceMemberId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-members', workspaceId] });

      const previousMembers = queryClient.getQueryData(['workspace-members', workspaceId]);

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
    onError: (error: Error, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
      }
      toast.error(`Failed to update member role: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Member role updated successfully');
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
      if (error) throw error;
      return response.data;
    },
    onMutate: async (workspaceMemberId) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-members', workspaceId] });

      const previousMembers = queryClient.getQueryData(['workspace-members', workspaceId]);

      queryClient.setQueryData(
        ['workspace-members', workspaceId],
        (old: WorkspaceMember[] | undefined) => {
          if (!old) return old;
          return old.filter((member) => member.workspaceMemberId !== workspaceMemberId);
        }
      );

      return { previousMembers };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['workspace-members', workspaceId], context.previousMembers);
      }
      toast.error(`Failed to remove member: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
  });
}
