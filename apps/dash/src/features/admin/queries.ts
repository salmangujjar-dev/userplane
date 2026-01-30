'use client';

import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceRole } from '@workspace/contract';
import { ADMIN_WORKSPACE_PROJECTS_PAGINATION, type AdminNotifyDuration } from '@workspace/contract';
import { toast } from 'sonner';

import { apiClient } from '@/client';
import { authClient } from '@/client/auth';
import { handleSafeResult, type SafeResult, showErrorToast } from '@/lib/errors';

import { adminKeys } from './query-keys';

// ============================================
// TYPES
// ============================================

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  emailVerified: boolean;
  createdAt: string;
  workspaceCount: number;
}

export interface AdminUserWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  joinedAt: string;
}

export interface AdminUserSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  impersonatedBy: string | null;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  emailVerified: boolean;
  createdAt: string;
  workspaceCount: number;
}

export interface AdminUsersListResponse {
  users: AdminUserListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserSessionsResponse {
  sessions: AdminUserSession[];
  userId: string;
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserWorkspacesResponse {
  workspaces: AdminUserWorkspace[];
  userId: string;
  total: number;
  limit: number;
  offset: number;
}

export interface AdminWorkspaceListItem {
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
  isDeleted: boolean;
}

export interface AdminWorkspaceMember {
  userId: string;
  userName: string;
  userEmail: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface AdminWorkspaceDetail {
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
}

export interface AdminWorkspaceMembersListResponse {
  members: AdminWorkspaceMember[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminWorkspaceProject {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  recordingCount: number;
}

export interface AdminWorkspaceProjectsListResponse {
  projects: AdminWorkspaceProject[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminWorkspacesListResponse {
  workspaces: AdminWorkspaceListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminRestoreWorkspaceResponse {
  workspace: {
    workspaceId: string;
    workspaceName: string;
    isDeleted: boolean;
    deletedAt: string | null;
  };
  restoredProjects: number;
  restoredLinks: number;
}

export interface AdminRestoreProjectResponse {
  workspaceId: string;
  project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AdminWorkspaceCreateInviteResponse {
  inviteUrl: string;
  workspaceId: string;
  workspaceUrl: string;
}

export interface BanUserInput {
  userId: string;
  reason: string;
  expiresInSeconds?: number;
  deleteWorkspacesForRoles?: WorkspaceRole[];
}

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
    queryFn: async (): Promise<AdminUsersResponse | null> => {
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

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch users');
      }

      return result.data as AdminUsersResponse | null;
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
        showErrorToast(result.error);
        return;
      }
      toast.success('User banned successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, { userId }, context) => {
      if (context?.previousUserDetail) {
        queryClient.setQueryData(adminKeys.userDetail(userId), context.previousUserDetail);
      }
      toast.error('Failed to ban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('User unbanned successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
    },
    onError: (error: unknown, { userId }, context) => {
      if (context?.previousUserDetail) {
        queryClient.setQueryData(adminKeys.userDetail(userId), context.previousUserDetail);
      }
      toast.error('Failed to unban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

export function useAdminRevokeSession() {
  const queryClient = useQueryClient();

  type SessionsQueryData = [QueryKey, SafeResult<AdminUserSessionsResponse> | undefined][];

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

      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsResponse>>({
        queryKey: adminKeys.userSessions(userId),
      });

      queryClient.setQueriesData<SafeResult<AdminUserSessionsResponse>>(
        { queryKey: adminKeys.userSessions(userId) },
        (old: SafeResult<AdminUserSessionsResponse> | undefined) => {
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to revoke session', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

export function useAdminRevokeAllSessions() {
  const queryClient = useQueryClient();

  type SessionsQueryData = [QueryKey, SafeResult<AdminUserSessionsResponse> | undefined][];

  return useMutation<
    SafeResult<AdminUserSessionsResponse>,
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

      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsResponse>>({
        queryKey: adminKeys.userSessions(userId),
      });

      queryClient.setQueriesData<SafeResult<AdminUserSessionsResponse>>(
        { queryKey: adminKeys.userSessions(userId) },
        (old: SafeResult<AdminUserSessionsResponse> | undefined) => {
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
        showErrorToast(result.error);
        return;
      }
      toast.success('All sessions revoked successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.userSessions(userId) });
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to revoke all sessions', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Workspace deactivated successfully');
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
      toast.error('Failed to deactivate workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

export function useAdminRestoreWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminRestoreWorkspaceResponse>,
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
        showErrorToast(result.error);
        return;
      }
      const { restoredProjects, restoredLinks } = result.data;
      toast.success('Workspace restored successfully', {
        description: `Restored ${restoredProjects} project(s) and ${restoredLinks} link(s)`,
      });
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
      toast.error('Failed to restore workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Invite token reset successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.workspaceDetail(workspaceId) });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reset invite token', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

interface AdminWorkspaceCreateInviteInput {
  workspaceUrl: string;
  notify?: 'never' | 'immediate' | '5m' | '15m' | '30m' | '60m';
  email?: string;
}

export function useAdminCreateWorkspaceInvite() {
  return useMutation<
    SafeResult<AdminWorkspaceCreateInviteResponse>,
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Workspace invite created successfully', {
        description: 'Invite URL has been generated',
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to create workspace invite', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Project deactivated successfully');
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceProjects(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceDetail(workspaceId),
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to deactivate project', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

export function useAdminRestoreProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminRestoreProjectResponse>,
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Project restored successfully');
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceProjects(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.workspaceDetail(workspaceId),
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to restore project', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

// ============================================
// IMPERSONATION
// ============================================

interface ImpersonateUserParams {
  userId: string;
  userName?: string;
}

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

      if (result.error) {
        throw new Error(result.error.message || 'Failed to impersonate user');
      }

      return result.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Now impersonating ${variables.userName || 'user'}`);
      // Invalidate all queries to refresh with the new session
      queryClient.invalidateQueries();
      // Redirect to home to start fresh with the impersonated session
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to impersonate user');
    },
  });

  return {
    impersonateUser: impersonateMutation.mutate,
    impersonateUserAsync: impersonateMutation.mutateAsync,
    isPending: impersonateMutation.isPending,
    error: impersonateMutation.error,
  };
}
