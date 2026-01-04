'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/client';
import { handleQueryResult, handleSafeResult, handleApiError, type SafeResult } from '@/lib/errors';
import type { PlanId } from '@workspace/pricing';

/**
 * Admin workspace list item
 */
export interface AdminWorkspaceListItem {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: PlanId;
  workspacePlanName: string;
  createdAt: string;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
  isDeleted: boolean;
}

/**
 * Admin workspace member
 */
export interface AdminWorkspaceMember {
  userId: string;
  userName: string;
  userEmail: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

/**
 * Admin workspace detail
 * Note: Members are fetched separately via useAdminWorkspaceMembers
 */
export interface AdminWorkspaceDetail {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: PlanId;
  workspacePlanName: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
}

/**
 * Admin workspace members list response
 */
export interface AdminWorkspaceMembersListResponse {
  members: AdminWorkspaceMember[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Admin workspaces list response
 */
export interface AdminWorkspacesListResponse {
  workspaces: AdminWorkspaceListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Search workspaces params
 */
export interface UseAdminSearchWorkspacesParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'name' | 'memberCount';
  sortDirection?: 'asc' | 'desc';
  filterStatus?: 'active' | 'deleted';
  filterPlan?: PlanId;
  enabled?: boolean;
}

/**
 * Hook for searching workspaces (admin only)
 */
export function useAdminSearchWorkspaces({
  search = '',
  limit = 5,
  offset = 0,
  sortBy = 'createdAt',
  sortDirection = 'desc',
  filterStatus,
  filterPlan,
  enabled = true,
}: UseAdminSearchWorkspacesParams = {}) {
  return useQuery({
    queryKey: [
      'admin-search-workspaces',
      { search, limit, offset, sortBy, sortDirection, filterStatus, filterPlan },
    ],
    queryFn: async () => {
      const [error, response] = await apiClient.admin.workspaces.search({
        query: {
          search: search || undefined,
          limit,
          offset,
          sortBy,
          sortDirection,
          filterStatus,
          filterPlan: filterPlan || undefined,
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
 * Hook for getting workspace detail (admin only)
 */
export function useAdminWorkspaceDetail(workspaceId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['admin-workspace-detail', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.get({
        params: { workspaceId },
      });
      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * Hook params for workspace members
 */
export interface UseAdminWorkspaceMembersParams {
  workspaceId: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Hook for getting workspace members with pagination (admin only)
 */
export function useAdminWorkspaceMembers({
  workspaceId,
  limit = 10,
  offset = 0,
  enabled = true,
}: UseAdminWorkspaceMembersParams) {
  return useQuery({
    queryKey: ['admin-workspace-members', workspaceId, { limit, offset }],
    queryFn: async () => {
      if (!workspaceId) return null;
      const [error, response] = await apiClient.admin.workspaces.members.list({
        params: { workspaceId },
        query: { limit, offset },
      });
      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * Hook for deactivating a workspace (admin only)
 */
export function useAdminDeactivateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminWorkspaceDetail>, Error, { workspaceId: string }>({
    mutationFn: async ({ workspaceId }) => {
      const [error, response] = await apiClient.admin.workspaces.deactivate({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to deactivate workspace');
        return;
      }
      toast.success('Workspace deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-search-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to deactivate workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for reactivating a workspace (admin only)
 */
export function useAdminReactivateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AdminWorkspaceDetail>, Error, { workspaceId: string }>({
    mutationFn: async ({ workspaceId }) => {
      const [error, response] = await apiClient.admin.workspaces.reactivate({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, { workspaceId }) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to reactivate workspace');
        return;
      }
      toast.success('Workspace reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-search-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reactivate workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for resetting workspace invite token (admin only)
 */
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
        handleApiError(result.error, 'Failed to reset invite token');
        return;
      }
      toast.success('Invite token reset successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reset invite token', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
