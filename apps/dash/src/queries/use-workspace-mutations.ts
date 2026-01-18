import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type {
  DeleteResponse,
  InvitePolicyData,
  InviteUrlData,
  JoinWorkspaceData,
  LeaveWorkspaceData,
  NotificationPreferencesData,
  QueryData,
  QuerySnapshot,
  UpdateResponse,
  WorkspaceInvitePolicy,
  WorkspaceNotifications,
  WorkspacesData,
} from '@/types';

type NotificationsQueryData = QueryData<NotificationPreferencesData>;
type WorkspacesQueryData = QueryData<WorkspacesData>;
type InvitePolicyQueryData = QueryData<InvitePolicyData>;

export function useUpdateNotifications(options?: { onError?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateResponse>,
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
        showErrorToast(result.error);
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
      handleUnknownError(error, 'Failed to process operation');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-notifications', variables.workspaceId],
      });
    },
  });
}

export function useRotateInvite() {
  return useMutation<SafeResult<InviteUrlData>, Error, string>({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.invite.rotate({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      toast.success('Invite token reset successfully');
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to process operation');
    },
  });
}

export function useDeleteWorkspace(
  currentWorkspaceId: string | null,
  onNavigate: (path: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<DeleteResponse>,
    Error,
    string,
    { previousQueries: QuerySnapshot<WorkspacesQueryData> }
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
      const previousQueries: QuerySnapshot<WorkspacesQueryData> =
        queryClient.getQueriesData<WorkspacesQueryData>({
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
        showErrorToast(result.error);
        return;
      }

      toast.success('Workspace deleted successfully');

      // Redirect to root so it can handle workspace selection
      if (deletedWorkspaceId === currentWorkspaceId) {
        onNavigate('/');
      }
    },
    onError: (error: unknown, workspaceId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateInvitePolicy(options?: { onError?: () => void; onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<InvitePolicyData>,
    Error,
    { workspaceId: string; policy: WorkspaceInvitePolicy; domains?: string[] | null },
    { previousPolicy: InvitePolicyQueryData | undefined }
  >({
    mutationFn: async ({ workspaceId, policy, domains }) => {
      const [error, response] = await apiClient.workspace.invitePolicy.update({
        params: { workspaceId },
        body: {
          workspaceInvitePolicy: policy,
          workspaceInviteDomains: domains,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ workspaceId, policy, domains }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-invite-policy', workspaceId] });

      const previousPolicy = queryClient.getQueryData<InvitePolicyQueryData>([
        'workspace-invite-policy',
        workspaceId,
      ]);

      queryClient.setQueryData<InvitePolicyQueryData>(
        ['workspace-invite-policy', workspaceId],
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaceInvitePolicy: policy,
              workspaceInviteDomains: domains ?? old.data.workspaceInviteDomains,
            },
          };
        }
      );

      return { previousPolicy };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousPolicy) {
          queryClient.setQueryData(
            ['workspace-invite-policy', variables.workspaceId],
            context.previousPolicy
          );
        }
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Invite policy updated');
      options?.onSuccess?.();
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousPolicy) {
        queryClient.setQueryData(
          ['workspace-invite-policy', variables.workspaceId],
          context.previousPolicy
        );
      }
      handleUnknownError(error, 'Failed to process operation');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-invite-policy', variables.workspaceId],
      });
    },
  });
}

export function useJoinWorkspace(options?: {
  onSuccess?: (status: 'joined' | 'requested') => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<JoinWorkspaceData>, Error, string>({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.join({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }

      if (result.data.alreadyMember) {
        // User is already a member - just invalidate queries, no toast
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        queryClient.invalidateQueries({ queryKey: ['workspace-suggestions'] });
        options?.onSuccess?.(result.data.status);
        return;
      }

      if (result.data.status === 'joined') {
        toast.success('Joined workspace successfully', {
          description: `You are now a member of ${result.data.workspaceName}`,
        });
        // Invalidate workspaces list to include the new workspace
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      } else {
        toast.success('Access request sent', {
          description: 'The workspace owner will be notified of your request.',
        });
      }
      // Invalidate suggestions since we've joined/requested
      queryClient.invalidateQueries({ queryKey: ['workspace-suggestions'] });
      options?.onSuccess?.(result.data.status);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to process operation');
    },
  });
}

export function useLeaveWorkspace(
  currentWorkspaceId: string | null,
  onNavigate: (path: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<LeaveWorkspaceData>,
    Error,
    string,
    { previousQueries: QuerySnapshot<WorkspacesQueryData> }
  >({
    mutationFn: async (workspaceId: string) => {
      const [error, response] = await apiClient.workspace.members.leave({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<WorkspacesQueryData> =
        queryClient.getQueriesData<WorkspacesQueryData>({
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
        showErrorToast(result.error);
        return;
      }

      if (result.data.workspaceDeleted) {
        toast.success('Left and deactivated workspace');
      } else {
        toast.success('Left workspace successfully');
      }

      // Redirect to root so it can handle workspace selection
      if (leftWorkspaceId === currentWorkspaceId) {
        onNavigate('/');
      }
    },
    onError: (error: unknown, workspaceId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process operation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
