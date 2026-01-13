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

interface NotificationPreferencesData {
  notificationPreferences: WorkspaceNotifications;
}

type NotificationsQueryData = SafeResult<NotificationPreferencesData>;
type WorkspacesQueryData = SafeResult<WorkspacesData>;
type QuerySnapshot = [queryKey: readonly unknown[], data: WorkspacesQueryData | undefined][];

export function useUpdateNotifications(options?: { onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateNotificationsData>,
    Error,
    { workspaceId: string; notifications: Partial<WorkspaceNotifications> },
    { previousNotifications: NotificationsQueryData | undefined }
  >({
    mutationFn: async ({ workspaceId, notifications }) => {
      const [error, response] = await apiClient.workspace.notifications.update({
        params: { workspaceId },
        body: notifications,
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async ({ workspaceId, notifications }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-notifications', workspaceId] });

      const previousNotifications = queryClient.getQueryData<NotificationsQueryData>([
        'workspace-notifications',
        workspaceId,
      ]);

      queryClient.setQueryData<NotificationsQueryData>(
        ['workspace-notifications', workspaceId],
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              notificationPreferences: {
                ...old.data.notificationPreferences,
                ...notifications,
              },
            },
          };
        }
      );

      return { previousNotifications };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback on API business error
        if (context?.previousNotifications) {
          queryClient.setQueryData(
            ['workspace-notifications', variables.workspaceId],
            context.previousNotifications
          );
        }
        handleApiError(result.error, 'Failed to update notifications');
        options?.onError?.();
        return;
      }
      toast.success('Notification preferences updated');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on network error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['workspace-notifications', variables.workspaceId],
          context.previousNotifications
        );
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-notifications', variables.workspaceId],
      });
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
    { previousQueries: QuerySnapshot }
  >({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.delete({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ? { deleted: true } : null);
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<WorkspacesQueryData>({
        queryKey: ['workspaces'],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<WorkspacesQueryData>({ queryKey: ['workspaces'] }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            workspaces: old.data.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
            total: Math.max(0, old.data.total - 1),
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, deletedWorkspaceId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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
    { previousQueries: QuerySnapshot }
  >({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.members.leave({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ? { left: true } : null);
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<WorkspacesQueryData>({
        queryKey: ['workspaces'],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<WorkspacesQueryData>({ queryKey: ['workspaces'] }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            workspaces: old.data.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
            total: Math.max(0, old.data.total - 1),
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, leftWorkspaceId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
