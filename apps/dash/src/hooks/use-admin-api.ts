'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/client';
import { handleSafeResult, showErrorToast, type SafeResult } from '@/lib/errors';

/**
 * Admin user list item
 */
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

/**
 * Admin user workspace
 */
export interface AdminUserWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

/**
 * Admin user session
 */
export interface AdminUserSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  impersonatedBy: string | null;
}

/**
 * Admin user detail
 * Note: Sessions and workspaces are fetched separately via dedicated hooks
 */
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

/**
 * Admin users list response
 */
export interface AdminUsersListResponse {
  users: AdminUserListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Admin user sessions response
 */
export interface AdminUserSessionsResponse {
  sessions: AdminUserSession[];
  userId: string;
}

/**
 * Search users params
 */
export interface UseAdminSearchUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortDirection?: 'asc' | 'desc';
  filterStatus?: 'active' | 'banned';
  enabled?: boolean;
}

/**
 * Hook for searching users (admin only)
 * Uses our custom admin API endpoint with workspace/session counts
 */
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
    queryKey: [
      'admin-search-users',
      { search, limit, offset, sortBy, sortDirection, filterStatus },
    ],
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

/**
 * Hook for getting user detail (admin only)
 */
export function useAdminUserDetail(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['admin-user-detail', userId],
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

/**
 * Hook params for user sessions
 */
export interface UseAdminUserSessionsParams {
  userId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * User sessions response with pagination
 */
export interface AdminUserSessionsResponse {
  sessions: AdminUserSession[];
  userId: string;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook for getting user sessions with pagination (admin only)
 */
export function useAdminUserSessions({
  userId,
  limit = 5,
  offset = 0,
  enabled = true,
}: UseAdminUserSessionsParams) {
  return useQuery({
    queryKey: ['admin-user-sessions', userId, { limit, offset }],
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

/**
 * Hook params for user workspaces
 */
export interface UseAdminUserWorkspacesParams {
  userId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * User workspaces response with pagination
 */
export interface AdminUserWorkspacesResponse {
  workspaces: AdminUserWorkspace[];
  userId: string;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook for getting user workspaces with pagination (admin only)
 */
export function useAdminUserWorkspaces({
  userId,
  limit = 10,
  offset = 0,
  enabled = true,
}: UseAdminUserWorkspacesParams) {
  return useQuery({
    queryKey: ['admin-user-workspaces', userId, { limit, offset }],
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

/**
 * Ban user input
 */
export interface BanUserInput {
  userId: string;
  reason: string;
  expiresInSeconds?: number;
}

/**
 * Hook for banning a user (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
export function useAdminBanUser() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminUserDetail>,
    Error,
    BanUserInput,
    { previousUserDetail: SafeResult<AdminUserDetail> | undefined }
  >({
    mutationFn: async ({ userId, reason, expiresInSeconds }) => {
      const [error, response] = await apiClient.admin.users.ban({
        params: { userId },
        body: {
          reason,
          expiresInSeconds,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ userId, reason, expiresInSeconds }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-user-detail', userId] });

      // Snapshot previous value
      const previousUserDetail = queryClient.getQueryData<SafeResult<AdminUserDetail>>([
        'admin-user-detail',
        userId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin-user-detail', userId],
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
      // Only invalidate the user detail to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      // Invalidate sessions since banning revokes all sessions
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
    },
    onError: (error: unknown, { userId }, context) => {
      // Rollback on error
      if (context?.previousUserDetail) {
        queryClient.setQueryData(['admin-user-detail', userId], context.previousUserDetail);
      }
      toast.error('Failed to ban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for unbanning a user (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-user-detail', userId] });

      // Snapshot previous value
      const previousUserDetail = queryClient.getQueryData<SafeResult<AdminUserDetail>>([
        'admin-user-detail',
        userId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin-user-detail', userId],
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
      // Only invalidate the user detail to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
    },
    onError: (error: unknown, { userId }, context) => {
      // Rollback on error
      if (context?.previousUserDetail) {
        queryClient.setQueryData(['admin-user-detail', userId], context.previousUserDetail);
      }
      toast.error('Failed to unban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for revoking a specific session (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-user-sessions', userId] });

      // Snapshot previous value - need to get all cached sessions queries for this user
      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsResponse>>({
        queryKey: ['admin-user-sessions', userId],
      });

      // Optimistically remove the session from all cached queries
      queryClient.setQueriesData<SafeResult<AdminUserSessionsResponse>>(
        { queryKey: ['admin-user-sessions', userId] },
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
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      toast.success('Session revoked successfully');
      // Only invalidate the sessions for this user
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback on error
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

/**
 * Hook for revoking all sessions for a user (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-user-sessions', userId] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueriesData<SafeResult<AdminUserSessionsResponse>>({
        queryKey: ['admin-user-sessions', userId],
      });

      // Optimistically clear all sessions
      queryClient.setQueriesData<SafeResult<AdminUserSessionsResponse>>(
        { queryKey: ['admin-user-sessions', userId] },
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
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      toast.success('All sessions revoked successfully');
      // Only invalidate the sessions for this user
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback on error
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
