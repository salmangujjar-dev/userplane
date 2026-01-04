'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/client';
import { handleQueryResult, handleSafeResult, handleApiError, type SafeResult } from '@/lib/errors';

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
 * Note: Sessions are fetched separately via useAdminUserSessions
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
  workspaces: AdminUserWorkspace[];
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
      return handleQueryResult(error, response?.data ?? null);
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
      return handleQueryResult(error, response?.data ?? null);
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
      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!userId,
    staleTime: 15 * 1000,
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
 */
export function useAdminBanUser() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminUserDetail>, Error, BanUserInput>({
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
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to ban user');
        return;
      }
      toast.success('User banned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to ban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for unbanning a user (admin only)
 */
export function useAdminUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminUserDetail>, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const [error, response] = await apiClient.admin.users.unban({
        params: { userId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to unban user');
        return;
      }
      toast.success('User unbanned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to unban user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for revoking a specific session (admin only)
 */
export function useAdminRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<{ sessions: AdminUserSession[]; revoked: string }>,
    Error,
    { sessionId: string; userId: string }
  >({
    mutationFn: async ({ sessionId }) => {
      const [error, response] = await apiClient.admin.sessions.revoke({
        params: { sessionId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to revoke session');
        return;
      }
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to revoke session', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for revoking all sessions for a user (admin only)
 */
export function useAdminRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminUserSessionsResponse>, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const [error, response] = await apiClient.admin.users.sessions.revokeAll({
        params: { userId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { userId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to revoke all sessions');
        return;
      }
      toast.success('All sessions revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to revoke all sessions', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
