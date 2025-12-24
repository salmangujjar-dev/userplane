import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, isErrorCode, type SafeResult } from '@/lib/errors';

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

interface UpdateNotificationsData {
  updated: boolean;
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateNotificationsData>,
    Error,
    { workspaceId: string; notifications: Partial<WorkspaceNotifications> },
    { previousWorkspaces: WorkspacesData | undefined }
  >({
    mutationFn: async ({ workspaceId, notifications }) => {
      const [error, response] = await apiClient.workspace.notifications.update({
        params: { workspaceId },
        body: notifications,
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async ({ workspaceId, notifications }) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData<WorkspacesData>(['workspaces']);
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
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousWorkspaces) {
          queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
        }
        handleApiError(result.error, 'Failed to update notifications');
        return;
      }
      toast.success('Notification preferences updated');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

interface RotateInviteData {
  inviteUrl: string;
}

export function useRotateInvite() {
  return useMutation<SafeResult<RotateInviteData>, Error, string>({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.invite.rotate({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to reset invite token');
        return;
      }
      toast.success('Invite token reset successfully');
    },
    onError: (error: unknown) => {
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

interface DeleteWorkspaceData {
  deleted: boolean;
}

export function useDeleteWorkspace(
  currentWorkspaceId: string | null,
  workspaces: Array<{ workspaceId: string; workspaceName: string }>,
  onNavigate: (path: string) => void,
  onSetWorkspace: (workspaceId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DeleteWorkspaceData>,
    Error,
    string,
    { previousWorkspaces: WorkspacesData | undefined }
  >({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.delete({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData<WorkspacesData>(['workspaces']);
      queryClient.setQueryData(['workspaces'], (old: WorkspacesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspaces: old.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
        };
      });
      return { previousWorkspaces };
    },
    onSuccess: (result, deletedWorkspaceId, context) => {
      if (!result.success) {
        if (context?.previousWorkspaces) {
          queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
        }
        handleApiError(result.error, 'Failed to delete workspace');
        return;
      }

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
    onError: (error: unknown, workspaceId, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

interface LeaveWorkspaceData {
  left: boolean;
}

export function useLeaveWorkspace(
  currentWorkspaceId: string | null,
  workspaces: Array<{ workspaceId: string; workspaceName: string }>,
  onNavigate: (path: string) => void,
  onSetWorkspace: (workspaceId: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<LeaveWorkspaceData>,
    Error,
    string,
    { previousWorkspaces: WorkspacesData | undefined }
  >({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.members.leave({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ? { left: true } : null);
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      const previousWorkspaces = queryClient.getQueryData<WorkspacesData>(['workspaces']);
      queryClient.setQueryData(['workspaces'], (old: WorkspacesData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspaces: old.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
        };
      });
      return { previousWorkspaces };
    },
    onSuccess: (result, leftWorkspaceId, context) => {
      if (!result.success) {
        if (context?.previousWorkspaces) {
          queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
        }
        // Special handling for last owner trying to leave
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_LAST_OWNER_LEAVE')) {
          toast.error("You're the last owner", {
            description: 'Transfer ownership or delete the workspace first.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to leave workspace');
        return;
      }

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
    onError: (error: unknown, workspaceId, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
