import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

interface WorkspaceNotifications {
  notifyOnLinkUsage?: boolean;
  notifyOnQuotaReset?: boolean;
  notifyOnQuotaLimit?: boolean;
  notifyOnMemberJoin?: boolean;
  notifyOnInviteAccepted?: boolean;
}

interface WorkspaceItem {
  workspaceId: string;
  workspaceName: string;
  notificationPreferences?: WorkspaceNotifications;
}

interface WorkspacesData {
  workspaces: WorkspaceItem[];
  total: number;
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      notifications,
    }: {
      workspaceId: string;
      notifications: Partial<WorkspaceNotifications>;
    }) => {
      const [error, response] = await apiClient.workspace.notifications.update({
        params: { workspaceId },
        body: notifications,
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async ({ workspaceId, notifications }) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData(['workspaces']);
      queryClient.setQueryData(['workspaces'], (old: WorkspacesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspaces: old.workspaces.map((ws) =>
            ws.workspaceId === workspaceId
              ? {
                  ...ws,
                  notificationPreferences: {
                    ...ws.notificationPreferences,
                    ...notifications,
                  },
                }
              : ws
          ),
        };
      });
      return { previousWorkspaces };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error(`Failed to update notifications: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Notification preferences updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useRotateInvite() {
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.invite.rotate({
        params: { workspaceId },
      });
      if (error) throw error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invite token reset successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset invite token: ${error.message}`);
    },
  });
}

export function useDeleteWorkspace(
  currentWorkspaceId: string | null,
  workspaces: Array<{ workspaceId: string; workspaceName: string }>,
  onNavigate: (path: string) => void,
  onSetWorkspace: (workspaceId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.delete({
        params: { workspaceId },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData(['workspaces']);
      queryClient.setQueryData(['workspaces'], (old: WorkspacesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspaces: old.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
        };
      });
      return { previousWorkspaces };
    },
    onError: (error: Error, workspaceId, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error(`Failed to delete workspace: ${error.message}`);
    },
    onSuccess: async (_, deletedWorkspaceId) => {
      toast.success('Workspace deleted successfully');

      if (deletedWorkspaceId === currentWorkspaceId) {
        const remainingWorkspaces = workspaces.filter(
          (ws) => ws.workspaceId !== deletedWorkspaceId
        );

        if (remainingWorkspaces.length > 0 && remainingWorkspaces[0]) {
          const nextWorkspace = remainingWorkspaces[0];
          onSetWorkspace(nextWorkspace.workspaceId);
          onNavigate(`/${nextWorkspace.workspaceId}/preferences`);
        } else {
          onNavigate('/workspace/create');
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useLeaveWorkspace(
  currentWorkspaceId: string | null,
  workspaces: Array<{ workspaceId: string; workspaceName: string }>,
  onNavigate: (path: string) => void,
  onSetWorkspace: (workspaceId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.members.leave({
        params: { workspaceId },
      });
      if (error) throw error;
      return response.data;
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData(['workspaces']);
      queryClient.setQueryData(['workspaces'], (old: WorkspacesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspaces: old.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
        };
      });
      return { previousWorkspaces };
    },
    onError: (error: Error, workspaceId, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error(`Failed to leave workspace: ${error.message}`);
    },
    onSuccess: async (_, leftWorkspaceId) => {
      toast.success('Left workspace successfully');

      if (leftWorkspaceId === currentWorkspaceId) {
        const remainingWorkspaces = workspaces.filter((ws) => ws.workspaceId !== leftWorkspaceId);

        if (remainingWorkspaces.length > 0 && remainingWorkspaces[0]) {
          const nextWorkspace = remainingWorkspaces[0];
          onSetWorkspace(nextWorkspace.workspaceId);
          onNavigate(`/${nextWorkspace.workspaceId}/preferences`);
        } else {
          onNavigate('/workspace/create');
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
