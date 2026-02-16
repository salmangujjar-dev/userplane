'use client';

import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { ADMIN_WORKSPACE_PROJECTS_PAGINATION } from '@/constants';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToastToast,
} from '@/lib/errors';
import {
  showCreatedToast,
  showDeletedToast,
  showImpersonatingToast,
  showUpdatedToast,
  showWorkspaceRestoredToast,
} from '@/lib/toasts';
import type {
  AdminCreateWorkspaceInviteData,
  AdminEntitlementsData,
  AdminNotifyDuration,
  AdminRestoreProjectData,
  AdminRestoreWorkspaceData,
  AdminUpdateEntitlementItem,
  AdminUserDetail,
  AdminUserSession,
  AdminUserSessionsData,
  AdminWorkspaceCreateInviteInput,
  AdminWorkspaceDetail,
  BanUserInput,
  ImpersonateUserParams,
} from '@/types';

import { adminKeys } from './query-keys';

// ============================================
// USER QUERIES
// ============================================

export interface UseAdminSearchUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortDirection?: 'asc' | 'desc';
  filterStatus?: 'active' | 'banned';
  enabled?: boolean;
}

export function useAdminSearchUsers({
  search = '',
  limit = 5,
  offset = 0,
  sortBy = 'createdAt',
  sortDirection = 'desc',
  filterStatus,
  enabled = true,
}: UseAdminSearchUsersParams = {}) {
  return useQuery({
    queryKey: adminKeys.userSearch({ search, limit, offset, sortBy, sortDirection, filterStatus }),
    queryFn: async () => {
      const [error, response] = await apiClient.admin.users.search({
        query: {
          search: search || undefined,
          limit,
          offset,
          sortBy,
          sortDirection,
          filterStatus,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useAdminUserDetail(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      const [error, response] = await apiClient.admin.users.get({
        params: { userId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export interface UseAdminUserSessionsParams {
  userId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useAdminUserSessions({
  userId,
  limit = 5,
  offset = 0,
  enabled = true,
}: UseAdminUserSessionsParams) {
  return useQuery({
    queryKey: adminKeys.userSessions(userId ?? '', { limit, offset }),
    queryFn: async () => {
      if (!userId) return null;
      const [error, response] = await apiClient.admin.users.sessions.list({
        params: { userId },
        query: { limit, offset },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export interface UseAdminUserWorkspacesParams {
  userId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useAdminUserWorkspaces({
  userId,
  limit = 10,
  offset = 0,
  enabled = true,
}: UseAdminUserWorkspacesParams) {
  return useQuery({
    queryKey: adminKeys.userWorkspaces(userId ?? '', { limit, offset }),
    queryFn: async () => {
      if (!userId) return null;
      const [error, response] = await apiClient.admin.users.workspaces.list({
        params: { userId },
        query: { limit, offset },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// Better Auth admin users list (simple version)
interface AdminUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string | null;
  createdAt?: Date;
  banned?: boolean | null;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
}

export function useAdminUsers({
  search = '',
  limit = 20,
  offset = 0,
  enabled = true,
}: {
  search?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: adminKeys.userSearch({ search, limit, offset }),
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit,
          offset,
          ...(search
            ? {
                searchValue: search,
                searchField: 'email' as const,
                searchOperator: 'contains' as const,
              }
            : {}),
          sortBy: 'createdAt',
          sortDirection: 'desc' as const,
        },
      });
      return handleSafeResult(
        result.error,
        result.data != null ? (result.data as AdminUsersResponse) : null
      );
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

// ============================================
// WORKSPACE QUERIES
// ============================================

export interface UseAdminSearchWorkspacesParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'name' | 'memberCount';
  sortDirection?: 'asc' | 'desc';
  filterStatus?: 'active' | 'deleted';
  enabled?: boolean;
}

export function useAdminSearchWorkspaces({
  search = '',
  limit = 5,
  offset = 0,
  sortBy = 'createdAt',
  sortDirection = 'desc',
  filterStatus,
  enabled = true,
}: UseAdminSearchWorkspacesParams = {}) {
  return useQuery({
    queryKey: adminKeys.workspaceSearch({
      search,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterStatus,
    }),
    queryFn: async () => {
      const [error, response] = await apiClient.admin.workspaces.search({
        query: {
          search: search || undefined,
          limit,
          offset,
          sortBy,
          sortDirection,
          filterStatus,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useAdminWorkspaceDetail(workspaceId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.workspaceDetail(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.get({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export interface UseAdminWorkspaceMembersParams {
  workspaceId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useAdminWorkspaceMembers({
  workspaceId,
  limit = 10,
  offset = 0,
  enabled = true,
}: UseAdminWorkspaceMembersParams) {
  return useQuery({
    queryKey: adminKeys.workspaceMembers(workspaceId ?? '', { limit, offset }),
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.members.list({
        params: { workspaceId },
        query: { limit, offset },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export interface UseAdminSearchWorkspaceProjectsParams {
  workspaceId: string | null;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'project_title' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
  filterStatus?: 'all' | 'active' | 'deleted';
  enabled?: boolean;
}

export function useAdminSearchWorkspaceProjects({
  workspaceId,
  search,
  limit = ADMIN_WORKSPACE_PROJECTS_PAGINATION.DEFAULT_PER_PAGE,
  offset = 0,
  sortBy = 'created_at',
  sortDirection = 'desc',
  filterStatus = 'active',
  enabled = true,
}: UseAdminSearchWorkspaceProjectsParams) {
  return useQuery({
    queryKey: adminKeys.workspaceProjects(workspaceId ?? '', {
      search,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterStatus,
    }),
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.projects.list({
        params: { workspaceId },
        query: { search, limit, offset, sortBy, sortDirection, filterStatus },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ============================================
// RECORDING STATS QUERIES
// ============================================

export function useAdminWorkspaceRecordingStats(
  workspaceId: string | null,
  filters?: {
    filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
    filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
    filterDeleted?: 'all' | 'active' | 'deleted';
    weeksToShow?: '12' | '24' | '36' | '48';
  }
) {
  return useQuery({
    queryKey: adminKeys.recordingDetail(
      `workspace-stats-${workspaceId}-${JSON.stringify(filters)}`
    ),
    queryFn: async () => {
      if (!workspaceId) return null;

      const [error, response] = await apiClient.admin.workspaces.recordingStats({
        params: { workspaceId },
        query: filters ?? {},
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

export function useAdminWorkspaceMemberRecordingStats(
  workspaceId: string | null,
  filters?: {
    filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
    filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
    filterDeleted?: 'all' | 'active' | 'deleted';
  }
) {
  return useQuery({
    queryKey: adminKeys.recordingDetail(`member-stats-${workspaceId}-${JSON.stringify(filters)}`),
    queryFn: async () => {
      if (!workspaceId) return null;

      const [error, response] = await apiClient.admin.workspaces.memberRecordingStats({
        params: { workspaceId },
        query: filters ?? {},
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

// ============================================
// ENTITLEMENT QUERIES
// ============================================

export function useAdminWorkspaceEntitlements(workspaceId: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.workspaceEntitlements(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.entitlements.get({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ============================================
// ENTITLEMENT MUTATIONS
// ============================================

export function useAdminUpdateEntitlements() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminEntitlementsData>,
    Error,
    { workspaceId: string; entitlements: AdminUpdateEntitlementItem[] }
  >({
    mutationFn: async ({ workspaceId, entitlements }) => {
      const [error, response] = await apiClient.admin.workspaces.entitlements.update({
        params: { workspaceId },
        body: { entitlements },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('Entitlements');
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceEntitlements(workspaceId),
      });
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to update entitlements');
    },
  });
}

// ============================================
// USER MUTATIONS
// ============================================

export function useAdminBanUser() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminUserDetail>,
    Error,
    BanUserInput,
    { previousUserDetail: SafeResult<AdminUserDetail> | undefined }
  >({
    mutationFn: async ({ userId, reason, expiresInSeconds, deleteWorkspacesForRoles }) => {
      const [error, response] = await apiClient.admin.users.ban({
        params: { userId },
        body: {
          reason,
          expiresInSeconds,
          deleteWorkspacesForRoles,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ userId, reason, expiresInSeconds }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.userDetail(userId) });

      const previousUserDetail = queryClient.getQueryData<SafeResult<AdminUserDetail>>(
        adminKeys.userDetail(userId)
      );

      queryClient.setQueryData(
        adminKeys.userDetail(userId),
        (old: SafeResult<AdminUserDetail> | undefined) => {
          if (!old?.success) return old;
          const banExpires = expiresInSeconds
            ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
            : null;
          return {
            ...old,
            data: {
              ...old.data,
              banned: true,
              banReason: reason,
              banExpires,
            },
          };
        }
      );

      return { previousUserDetail };
    },
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('User ban status');
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, { userId }, context) => {
      if (context?.previousUserDetail) {
        queryClient.setQueryData(adminKeys.userDetail(userId), context.previousUserDetail);
      }
      handleUnknownError(error, 'Failed to ban user');
    },
  });
}

export function useAdminUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminUserDetail>,
    Error,
    { userId: string },
    { previousUserDetail: SafeResult<AdminUserDetail> | undefined }
  >({
    mutationFn: async ({ userId }) => {
      const [error, response] = await apiClient.admin.users.unban({
        params: { userId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.userDetail(userId) });

      const previousUserDetail = queryClient.getQueryData<SafeResult<AdminUserDetail>>(
        adminKeys.userDetail(userId)
      );

      queryClient.setQueryData(
        adminKeys.userDetail(userId),
        (old: SafeResult<AdminUserDetail> | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              banned: false,
              banReason: null,
              banExpires: null,
            },
          };
        }
      );

      return { previousUserDetail };
    },
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('User ban status');
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
    },
    onError: (error: unknown, { userId }, context) => {
      if (context?.previousUserDetail) {
        queryClient.setQueryData(adminKeys.userDetail(userId), context.previousUserDetail);
      }
      handleUnknownError(error, 'Failed to unban user');
    },
  });
}

export function useAdminRevokeSession() {
  const queryClient = useQueryClient();

  type SessionsQueryData = [QueryKey, SafeResult<AdminUserSessionsData> | undefined][];

  return useMutation<
    SafeResult<{ sessions: AdminUserSession[]; revoked: string }>,
    Error,
    { sessionId: string; userId: string },
    { previousSessions: SessionsQueryData }
  >({
    mutationFn: async ({ sessionId }) => {
      const [error, response] = await apiClient.admin.sessions.revoke({
        params: { sessionId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ sessionId, userId }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.userSessions(userId) });

      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsData>>({
        queryKey: adminKeys.userSessions(userId),
      });

      queryClient.setQueriesData<SafeResult<AdminUserSessionsData>>(
        { queryKey: adminKeys.userSessions(userId) },
        (old: SafeResult<AdminUserSessionsData> | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              sessions: old.data.sessions.filter((s: AdminUserSession) => s.id !== sessionId),
              total: Math.max(0, old.data.total - 1),
            },
          };
        }
      );

      return { previousSessions };
    },
    onSuccess: (result, { userId }, context) => {
      if (!result.success) {
        if (context?.previousSessions) {
          context.previousSessions.forEach(([queryKey, data]) => {
            queryClient.setQueryData(queryKey, data);
          });
        }
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('Session');
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      handleUnknownError(error, 'Failed to revoke session');
    },
  });
}

export function useAdminRevokeAllSessions() {
  const queryClient = useQueryClient();

  type SessionsQueryData = [QueryKey, SafeResult<AdminUserSessionsData> | undefined][];

  return useMutation<
    SafeResult<AdminUserSessionsData>,
    Error,
    { userId: string },
    { previousSessions: SessionsQueryData }
  >({
    mutationFn: async ({ userId }) => {
      const [error, response] = await apiClient.admin.users.sessions.revokeAll({
        params: { userId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.userSessions(userId) });

      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsData>>({
        queryKey: adminKeys.userSessions(userId),
      });

      queryClient.setQueriesData<SafeResult<AdminUserSessionsData>>(
        { queryKey: adminKeys.userSessions(userId) },
        (old: SafeResult<AdminUserSessionsData> | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              sessions: [],
              total: 0,
            },
          };
        }
      );

      return { previousSessions };
    },
    onSuccess: (result, { userId }, context) => {
      if (!result.success) {
        if (context?.previousSessions) {
          context.previousSessions.forEach(([queryKey, data]) => {
            queryClient.setQueryData(queryKey, data);
          });
        }
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('All sessions');
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      handleUnknownError(error, 'Failed to revoke all sessions');
    },
  });
}

// ============================================
// WORKSPACE MUTATIONS
// ============================================

export function useAdminDeactivateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminWorkspaceDetail>,
    Error,
    { workspaceId: string; notify?: AdminNotifyDuration },
    { previousWorkspaceDetail: SafeResult<AdminWorkspaceDetail> | undefined }
  >({
    mutationFn: async ({ workspaceId, notify }) => {
      const [error, response] = await apiClient.admin.workspaces.deactivate({
        params: { workspaceId },
        body: notify ? { notify } : undefined,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ workspaceId }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });

      const previousWorkspaceDetail = queryClient.getQueryData<SafeResult<AdminWorkspaceDetail>>(
        adminKeys.workspaceDetail(workspaceId)
      );

      queryClient.setQueryData(
        adminKeys.workspaceDetail(workspaceId),
        (old: SafeResult<AdminWorkspaceDetail> | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            },
          };
        }
      );

      return { previousWorkspaceDetail };
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('Workspace');
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaces() });
    },
    onError: (error: unknown, { workspaceId }, context) => {
      if (context?.previousWorkspaceDetail) {
        queryClient.setQueryData(
          adminKeys.workspaceDetail(workspaceId),
          context.previousWorkspaceDetail
        );
      }
      handleUnknownError(error, 'Failed to deactivate workspace');
    },
  });
}

export function useAdminRestoreWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminRestoreWorkspaceData>,
    Error,
    { workspaceId: string; notify?: AdminNotifyDuration },
    { previousWorkspaceDetail: SafeResult<AdminWorkspaceDetail> | undefined }
  >({
    mutationFn: async ({ workspaceId, notify }) => {
      const [error, response] = await apiClient.admin.workspaces.restore({
        params: { workspaceId },
        body: notify ? { notify } : undefined,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ workspaceId }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });

      const previousWorkspaceDetail = queryClient.getQueryData<SafeResult<AdminWorkspaceDetail>>(
        adminKeys.workspaceDetail(workspaceId)
      );

      queryClient.setQueryData(
        adminKeys.workspaceDetail(workspaceId),
        (old: SafeResult<AdminWorkspaceDetail> | undefined) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              isDeleted: false,
              deletedAt: null,
            },
          };
        }
      );

      return { previousWorkspaceDetail };
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      const { restoredProjects, restoredLinks } = result.data;
      showWorkspaceRestoredToast(restoredProjects, restoredLinks);
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaces() });
    },
    onError: (error: unknown, { workspaceId }, context) => {
      if (context?.previousWorkspaceDetail) {
        queryClient.setQueryData(
          adminKeys.workspaceDetail(workspaceId),
          context.previousWorkspaceDetail
        );
      }
      handleUnknownError(error, 'Failed to restore workspace');
    },
  });
}

export function useAdminResetInviteToken() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminWorkspaceDetail>, Error, { workspaceId: string }>({
    mutationFn: async ({ workspaceId }) => {
      const [error, response] = await apiClient.admin.workspaces.resetInviteToken({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('Invite token', 'Previous invite links are now invalid');
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to reset invite token');
    },
  });
}

export function useAdminCreateWorkspaceInvite() {
  return useMutation<
    SafeResult<AdminCreateWorkspaceInviteData>,
    Error,
    AdminWorkspaceCreateInviteInput
  >({
    mutationFn: async (input) => {
      const [error, response] = await apiClient.admin.workspace.createInvite({
        body: {
          workspaceUrl: input.workspaceUrl,
          notify: input.notify,
          email: input.email,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showCreatedToast('Workspace invite', 'Invite URL has been generated');
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to create workspace invite');
    },
  });
}

// ============================================
// PROJECT MUTATIONS
// ============================================

export function useAdminDeactivateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<{ workspaceId: string; projectId: string }>,
    Error,
    { projectId: string; notify?: AdminNotifyDuration }
  >({
    mutationFn: async ({ projectId, notify }) => {
      const [error, response] = await apiClient.admin.projects.deactivate({
        params: { workspaceId, projectId },
        body: notify ? { notify } : undefined,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('Project');
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceProjects(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceDetail(workspaceId),
      });
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to deactivate project');
    },
  });
}

export function useAdminRestoreProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminRestoreProjectData>,
    Error,
    { projectId: string; notify?: AdminNotifyDuration }
  >({
    mutationFn: async ({ projectId, notify }) => {
      const [error, response] = await apiClient.admin.projects.restore({
        params: { workspaceId, projectId },
        body: notify ? { notify } : undefined,
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('Project');
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceProjects(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceDetail(workspaceId),
      });
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to restore project');
    },
  });
}

// ============================================
// IMPERSONATION
// ============================================

/**
 * Hook for impersonating users (admin only)
 * Provides a mutation to start impersonating a user
 */
export function useImpersonation() {
  const queryClient = useQueryClient();

  const impersonateMutation = useMutation({
    mutationFn: async ({ userId }: ImpersonateUserParams) => {
      const result = await authClient.admin.impersonateUser({
        userId,
      });
      return handleSafeResult(result.error, result.data ?? null);
    },
    onSuccess: (result, variables) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      showImpersonatingToast(variables.userName);
      // Invalidate all queries to refresh with the new session
      queryClient.invalidateQueries();
      // Redirect to home to start fresh with the impersonated session
      window.location.href = '/';
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to impersonate user');
    },
  });

  return {
    impersonateUser: impersonateMutation.mutate,
    impersonateUserAsync: impersonateMutation.mutateAsync,
    isPending: impersonateMutation.isPending,
    error: impersonateMutation.error,
  };
}
