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
  onNavigate: (path: string) => void
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
  workspaceId: string;
  workspaceDeleted?: boolean;
}

type WorkspaceInvitePolicy = 'private' | 'whitelisted' | 'protected';

interface InvitePolicyData {
  workspaceId: string;
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  workspaceInviteDomains: string[] | null;
}

type InvitePolicyQueryData = SafeResult<InvitePolicyData>;

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
        handleApiError(result.error, 'Failed to update invite policy');
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
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-invite-policy', variables.workspaceId],
      });
    },
  });
}

interface JoinWorkspaceData {
  workspaceId: string;
  workspaceName: string;
  status: 'joined' | 'requested';
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
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_ALREADY_EXISTS')) {
          toast.info('You are already a member of this workspace');
          return;
        }
        if (isErrorCode(result.error, 'WORKSPACE_INVITE_POLICY_PRIVATE')) {
          toast.error('This workspace is private', {
            description: 'You need an invitation to join this workspace.',
          });
          return;
        }
        if (isErrorCode(result.error, 'WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH')) {
          toast.error('Domain not allowed', {
            description: 'Your email domain is not allowed to join this workspace.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to join workspace');
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
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
    { previousQueries: QuerySnapshot }
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
        if (isErrorCode(result.error, 'WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS')) {
          toast.error("You're the only owner", {
            description: 'Please make someone else an owner before leaving.',
          });
          return;
        }
        if (isErrorCode(result.error, 'WORKSPACE_DELETE_FAILED')) {
          toast.error('Failed to deactivate workspace', {
            description: 'There was a problem deactivating the workspace. Please try again.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to leave workspace');
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
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
