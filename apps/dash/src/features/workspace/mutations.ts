import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type { WorkspaceInvitePolicy } from '@/types';
import type {
  DeleteResponse,
  InvitePolicyData,
  InviteUrlData,
  JoinWorkspaceData,
  LeaveWorkspaceData,
  MembersListResponse,
  NotificationPreferencesData,
  QueryData,
  QuerySnapshot,
  UpdateResponse,
  WorkspaceNotifications,
  WorkspacesData,
} from '@/types';

import { workspaceKeys } from './query-keys';

type NotificationsQueryData = QueryData<NotificationPreferencesData>;
type WorkspacesQueryData = QueryData<WorkspacesData>;
type InvitePolicyQueryData = QueryData<InvitePolicyData>;
type MembersQueryData = QueryData<MembersListResponse>;

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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.notifications(workspaceId) });

      const previousNotifications = queryClient.getQueryData<NotificationsQueryData>(
        workspaceKeys.notifications(workspaceId)
      );

      queryClient.setQueryData<NotificationsQueryData>(
        workspaceKeys.notifications(workspaceId),
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
            workspaceKeys.notifications(variables.workspaceId),
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
          workspaceKeys.notifications(variables.workspaceId),
          context.previousNotifications
        );
      }
      handleUnknownError(error, 'Failed to process operation');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.notifications(variables.workspaceId),
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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<WorkspacesQueryData> =
        queryClient.getQueriesData<WorkspacesQueryData>({
          queryKey: workspaceKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<WorkspacesQueryData>(
        { queryKey: workspaceKeys.lists() },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaces: old.data.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
              total: Math.max(0, old.data.total - 1),
            },
          };
        }
      );

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
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.invitePolicy(workspaceId) });

      const previousPolicy = queryClient.getQueryData<InvitePolicyQueryData>(
        workspaceKeys.invitePolicy(workspaceId)
      );

      queryClient.setQueryData<InvitePolicyQueryData>(
        workspaceKeys.invitePolicy(workspaceId),
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
            workspaceKeys.invitePolicy(variables.workspaceId),
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
          workspaceKeys.invitePolicy(variables.workspaceId),
          context.previousPolicy
        );
      }
      handleUnknownError(error, 'Failed to process operation');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitePolicy(variables.workspaceId),
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
        queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
        queryClient.invalidateQueries({ queryKey: workspaceKeys.suggestions() });
        options?.onSuccess?.(result.data.status);
        return;
      }

      if (result.data.status === 'joined') {
        toast.success('Joined workspace successfully', {
          description: `You are now a member of ${result.data.workspaceName}`,
        });
        // Invalidate workspaces list to include the new workspace
        queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      } else {
        toast.success('Access request sent', {
          description: 'The workspace owner will be notified of your request.',
        });
      }
      // Invalidate suggestions since we've joined/requested
      queryClient.invalidateQueries({ queryKey: workspaceKeys.suggestions() });
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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<WorkspacesQueryData> =
        queryClient.getQueriesData<WorkspacesQueryData>({
          queryKey: workspaceKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<WorkspacesQueryData>(
        { queryKey: workspaceKeys.lists() },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaces: old.data.workspaces.filter((ws) => ws.workspaceId !== workspaceId),
              total: Math.max(0, old.data.total - 1),
            },
          };
        }
      );

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
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

// Team/Member mutations

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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.members(workspaceId ?? '') });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<MembersQueryData> =
        queryClient.getQueriesData<MembersQueryData>({
          queryKey: workspaceKeys.members(workspaceId ?? ''),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<MembersQueryData>(
        { queryKey: workspaceKeys.members(workspaceId ?? '') },
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
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
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
      await queryClient.cancelQueries({ queryKey: workspaceKeys.members(workspaceId ?? '') });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<MembersQueryData> =
        queryClient.getQueriesData<MembersQueryData>({
          queryKey: workspaceKeys.members(workspaceId ?? ''),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<MembersQueryData>(
        { queryKey: workspaceKeys.members(workspaceId ?? '') },
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
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

// ============================================
// WORKSPACE CREATION
// ============================================

type CreateWorkspaceInput =
  | {
      type: 'manual';
      url: string;
    }
  | {
      type: 'invite';
      inviteToken: string;
    };

type CreateWorkspaceData =
  | {
      created: false;
      workspaceUrl?: string;
    }
  | {
      created: true;
      workspaceId: string;
      workspaceName: string;
    };

/**
 * Hook to create a new workspace
 * Supports both manual URL input and invite token flows
 * All workspaces start on free plan - users upgrade via subscription
 * Handles API call, loading states, and error handling
 */
export function useCreateWorkspace() {
  return useMutation<SafeResult<CreateWorkspaceData>, Error, CreateWorkspaceInput>({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const body =
        input.type === 'manual'
          ? {
              type: 'manual' as const,
              url: input.url.startsWith('http') ? input.url : `https://${input.url}`,
            }
          : {
              type: 'invite' as const,
              inviteToken: input.inviteToken,
            };

      const [error, response] = await apiClient.provisioner.createWorkspace({
        body,
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to create workspace');
    },
  });
}

// ============================================
// APPEARANCE / PREFERENCES MUTATIONS
// ============================================

type PreferencesQueryData = QueryData<{
  workspaceId: string;
  recordingCustomizeLink: boolean;
  recordingCompanyName: string | null;
  recordingCompanyLogoPath: string | null;
  recordingHeader: string | null;
  recordingFootnote: string | null;
  recordingPrimaryColor: string | null;
  recordingMaxDurationMs: number | null;
  recordingSlug: string;
}>;

export function useUpdateToggle(workspaceId: string | null, onError?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateResponse>,
    Error,
    boolean,
    { previousPreferences: PreferencesQueryData | undefined }
  >({
    mutationFn: async (enabled: boolean) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: { recordingCustomizeLink: enabled },
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.preferences(workspaceId ?? '') });

      const previousPreferences = queryClient.getQueryData<PreferencesQueryData>(
        workspaceKeys.preferences(workspaceId ?? '')
      );

      queryClient.setQueryData<PreferencesQueryData>(
        workspaceKeys.preferences(workspaceId ?? ''),
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              recordingCustomizeLink: enabled,
            },
          };
        }
      );

      return { previousPreferences };
    },
    onSuccess: (result, enabled, context) => {
      if (!result.success) {
        // Rollback on API business error
        if (context?.previousPreferences) {
          queryClient.setQueryData(
            workspaceKeys.preferences(workspaceId ?? ''),
            context.previousPreferences
          );
        }
        showErrorToast(result.error);
        onError?.();
        return;
      }
      toast.success('Recording link customization updated');
    },
    onError: (error: unknown, enabled, context) => {
      // Rollback on network error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          workspaceKeys.preferences(workspaceId ?? ''),
          context.previousPreferences
        );
      }
      handleUnknownError(error, 'Failed to update appearance');
      onError?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.preferences(workspaceId ?? '') });
    },
  });
}

interface AppearanceUpdates {
  recordingCompanyName?: string | null;
  recordingCompanyLogoPath?: string | null;
  recordingHeader?: string | null;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string | null;
}

export function useUpdateAppearance(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateResponse>,
    Error,
    AppearanceUpdates,
    { previousPreferences: PreferencesQueryData | undefined }
  >({
    mutationFn: async (updates: AppearanceUpdates) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.preferences.update({
        params: { workspaceId },
        body: updates,
      });
      return handleSafeResult(error, response?.data ? { updated: true } : null);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.preferences(workspaceId ?? '') });
      const previousPreferences = queryClient.getQueryData<PreferencesQueryData>(
        workspaceKeys.preferences(workspaceId ?? '')
      );
      queryClient.setQueryData(
        workspaceKeys.preferences(workspaceId ?? ''),
        (old: PreferencesQueryData | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ...updates,
            },
          };
        }
      );
      return { previousPreferences };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousPreferences) {
          queryClient.setQueryData(
            workspaceKeys.preferences(workspaceId ?? ''),
            context.previousPreferences
          );
        }
        showErrorToast(result.error);
        return;
      }
      toast.success('Appearance settings updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          workspaceKeys.preferences(workspaceId ?? ''),
          context.previousPreferences
        );
      }
      handleUnknownError(error, 'Failed to update appearance');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.preferences(workspaceId ?? '') });
    },
  });
}

// ============================================
// OVERVIEW MUTATIONS (WORKSPACE NAME)
// ============================================

interface UpdateWorkspaceNameData {
  workspaceName: string;
}

interface WorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
}

export function useUpdateWorkspaceName(
  workspaceId: string | null,
  onError?: (originalName: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateWorkspaceNameData>,
    Error,
    string,
    { previousWorkspace: WorkspaceData | undefined }
  >({
    mutationFn: async (newName: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.updateName({
        params: { workspaceId },
        body: { name: newName },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.detail(workspaceId ?? '') });
      const previousWorkspace = queryClient.getQueryData<WorkspaceData>(
        workspaceKeys.detail(workspaceId ?? '')
      );
      queryClient.setQueryData(
        workspaceKeys.detail(workspaceId ?? ''),
        (old: WorkspaceData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            workspace: {
              ...old.workspace,
              workspaceName: newName,
            },
          };
        }
      );
      return { previousWorkspace };
    },
    onSuccess: (result, newName, context) => {
      if (!result.success) {
        if (context?.previousWorkspace) {
          queryClient.setQueryData(
            workspaceKeys.detail(workspaceId ?? ''),
            context.previousWorkspace
          );
          const originalName = context.previousWorkspace.workspace?.workspaceName || '';
          if (onError) {
            onError(originalName);
          }
        }
        showErrorToast(result.error);
        return;
      }
      toast.success('Workspace name updated successfully');
    },
    onError: (error: unknown, newName, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(
          workspaceKeys.detail(workspaceId ?? ''),
          context.previousWorkspace
        );
        const originalName = context.previousWorkspace.workspace?.workspaceName || '';
        if (onError) {
          onError(originalName);
        }
      }
      handleUnknownError(error, 'Failed to update workspace name');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId ?? '') });
      // Also invalidate workspaces list so sidebar updates
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

// ============================================
// BILLING EMAIL MUTATIONS
// ============================================

interface WorkspaceBillingEmailData {
  workspaceId: string;
  workspaceBillingEmail: string | null;
}

type BillingEmailQueryData = QueryData<WorkspaceBillingEmailData>;

export function useUpdateWorkspaceBillingEmail(options?: {
  onError?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<WorkspaceBillingEmailData>,
    Error,
    { workspaceId: string; email: string },
    { previousBillingEmail: BillingEmailQueryData | undefined }
  >({
    mutationFn: async ({ workspaceId, email }) => {
      const [error, response] = await apiClient.workspace.updateWorkspaceBillingEmail({
        params: { workspaceId },
        body: { email },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ workspaceId, email }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.billingEmail(workspaceId) });

      const previousBillingEmail = queryClient.getQueryData<BillingEmailQueryData>(
        workspaceKeys.billingEmail(workspaceId)
      );

      queryClient.setQueryData<BillingEmailQueryData>(
        workspaceKeys.billingEmail(workspaceId),
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaceBillingEmail: email,
            },
          };
        }
      );

      return { previousBillingEmail };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousBillingEmail) {
          queryClient.setQueryData(
            workspaceKeys.billingEmail(variables.workspaceId),
            context.previousBillingEmail
          );
        }
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Billing email updated');
      options?.onSuccess?.();
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousBillingEmail) {
        queryClient.setQueryData(
          workspaceKeys.billingEmail(variables.workspaceId),
          context.previousBillingEmail
        );
      }
      handleUnknownError(error, 'Failed to update billing email');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.billingEmail(variables.workspaceId),
      });
    },
  });
}

// ============================================
// WORKSPACE RESTORE
// ============================================

import type { WorkspaceRestoreData } from '@/types';

interface RestoreWorkspaceInput {
  workspaceId: string;
}

/**
 * Hook to restore a deleted workspace
 * Restores workspace and associated projects/links
 */
export function useRestoreWorkspace() {
  return useMutation<SafeResult<WorkspaceRestoreData>, Error, RestoreWorkspaceInput>({
    mutationFn: async (input: RestoreWorkspaceInput) => {
      const [error, response] = await apiClient.workspace.restore({
        params: { workspaceId: input.workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to restore workspace');
    },
  });
}

interface RequestBillingEmailChangeData {
  workspaceId: string;
  message: string;
}

export function useRequestBillingEmailChange(options?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  return useMutation<
    SafeResult<RequestBillingEmailChangeData>,
    Error,
    { workspaceId: string; email: string }
  >({
    mutationFn: async ({ workspaceId, email }) => {
      const [error, response] = await apiClient.workspace.requestBillingEmailChange({
        params: { workspaceId },
        body: { email },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Verification email sent');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to send verification email');
      options?.onError?.();
    },
  });
}

interface VerifyBillingEmailChangeData {
  workspaceId: string;
  workspaceBillingEmail: string;
}

export function useVerifyBillingEmailChange(options?: {
  onSuccess?: (data: VerifyBillingEmailChangeData) => void;
  onError?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<VerifyBillingEmailChangeData>, Error, { token: string }>({
    mutationFn: async ({ token }) => {
      const [error, response] = await apiClient.workspace.verifyBillingEmailChange({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      // Invalidate billing email query for the workspace
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.billingEmail(result.data.workspaceId),
      });
      options?.onSuccess?.(result.data);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to verify billing email');
      options?.onError?.();
    },
  });
}
