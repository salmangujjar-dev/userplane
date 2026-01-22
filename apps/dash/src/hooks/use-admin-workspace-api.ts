'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_WORKSPACE_PROJECTS_PAGINATION, type AdminNotifyDuration } from '@workspace/contract';
import type { PlanId, UserSelectablePlanId } from '@workspace/pricing';
import { toast } from 'sonner';

import { apiClient } from '@/client';
import { handleSafeResult, type SafeResult, showErrorToast } from '@/lib/errors';

/**
 * Admin restore project response
 */
interface AdminRestoreProjectResponse {
  workspaceId: string;
  project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

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
 * Admin workspace project
 */
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

/**
 * Admin workspace projects list response
 */
export interface AdminWorkspaceProjectsListResponse {
  projects: AdminWorkspaceProject[];
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
      return handleSafeResult(error, response?.data ?? null);
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
      return handleSafeResult(error, response?.data ?? null);
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
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * Hook params for searching workspace projects
 */
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

/**
 * Hook for searching workspace projects with pagination, filtering, and sorting (admin only)
 */
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
    queryKey: [
      'admin-search-workspace-projects',
      workspaceId,
      { search, limit, offset, sortBy, sortDirection, filterStatus },
    ],
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

/**
 * Hook for deactivating a workspace (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-workspace-detail', workspaceId] });

      // Snapshot previous value
      const previousWorkspaceDetail = queryClient.getQueryData<SafeResult<AdminWorkspaceDetail>>([
        'admin-workspace-detail',
        workspaceId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin-workspace-detail', workspaceId],
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
      // Invalidate the workspace detail and search queries to update the list
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-search-workspaces'] });
    },
    onError: (error: unknown, { workspaceId }, context) => {
      // Rollback on error
      if (context?.previousWorkspaceDetail) {
        queryClient.setQueryData(
          ['admin-workspace-detail', workspaceId],
          context.previousWorkspaceDetail
        );
      }
      toast.error('Failed to deactivate workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for restoring a workspace (admin only)
 * Uses optimistic updates and targeted cache invalidation
 */
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-workspace-detail', workspaceId] });

      // Snapshot previous value
      const previousWorkspaceDetail = queryClient.getQueryData<SafeResult<AdminWorkspaceDetail>>([
        'admin-workspace-detail',
        workspaceId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['admin-workspace-detail', workspaceId],
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
      // Invalidate the workspace detail and search queries to update the list
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-search-workspaces'] });
    },
    onError: (error: unknown, { workspaceId }, context) => {
      // Rollback on error
      if (context?.previousWorkspaceDetail) {
        queryClient.setQueryData(
          ['admin-workspace-detail', workspaceId],
          context.previousWorkspaceDetail
        );
      }
      toast.error('Failed to restore workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for resetting workspace invite token (admin only)
 * Uses targeted cache invalidation (no optimistic update - token is server-generated)
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Invite token reset successfully');
      // Only invalidate the workspace detail to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-detail', workspaceId] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reset invite token', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

// ============================================
// ADMIN WORKSPACE PROVISIONING
// ============================================

/**
 * Admin restore workspace response
 */
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

/**
 * Admin provision workspace input
 */
export interface AdminProvisionWorkspaceInput {
  owner: {
    email: string;
    name: string;
  };
  workspace: {
    name: string;
    url: string;
    plan: UserSelectablePlanId;
  };
  members?: Array<{
    email: string;
    name: string;
    role: 'admin' | 'member';
  }>;
}

/**
 * Admin provision workspace response
 */
export interface AdminProvisionWorkspaceResponse {
  workspaceId: string;
  workspaceName: string;
  owner: {
    userId: string;
    email: string;
    name: string;
    isNew: boolean;
  };
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
    isNew: boolean;
  }>;
}

/**
 * Hook for provisioning a workspace on behalf of a user (admin only)
 * Creates users if they don't exist, creates workspace, and adds members
 */
export function useAdminProvisionWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<AdminProvisionWorkspaceResponse>,
    Error,
    AdminProvisionWorkspaceInput
  >({
    mutationFn: async (input) => {
      const [error, response] = await apiClient.admin.workspaces.provision({
        body: {
          owner: input.owner,
          workspace: input.workspace,
          members: input.members ?? [],
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      toast.success('Workspace provisioned successfully', {
        description: `Created workspace "${result.data.workspaceName}" for ${result.data.owner.email}`,
      });
      // Invalidate workspaces list to show the new workspace
      queryClient.invalidateQueries({ queryKey: ['admin-search-workspaces'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to provision workspace', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Workspace create invite response
 */
export interface AdminWorkspaceCreateInviteResponse {
  inviteUrl: string;
  workspaceId: string;
  workspaceUrl: string;
  workspacePlan: PlanId;
}

/**
 * Workspace create invite input
 */
interface AdminWorkspaceCreateInviteInput {
  workspaceUrl: string;
  plan?: PlanId;
  notify?: 'never' | 'immediate' | '5m' | '15m' | '30m' | '60m';
  email?: string;
}

/**
 * Hook for creating a workspace invite URL (admin only)
 * Generates invite URL with predetermined workspace details
 */
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
          plan: input.plan,
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
// ADMIN PROJECT MANAGEMENT
// ============================================

/**
 * Hook for deactivating a project (admin only)
 * Invalidates all project search queries and workspace detail
 */
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
      // Invalidate all search queries for this workspace's projects
      queryClient.invalidateQueries({
        queryKey: ['admin-search-workspace-projects', workspaceId],
      });
      // Also invalidate workspace detail to update project counts
      queryClient.invalidateQueries({
        queryKey: ['admin-workspace-detail', workspaceId],
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to deactivate project', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook for restoring a project (admin only)
 * Invalidates all project search queries and workspace detail
 */
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
      // Invalidate all search queries for this workspace's projects
      queryClient.invalidateQueries({
        queryKey: ['admin-search-workspace-projects', workspaceId],
      });
      // Also invalidate workspace detail to update project counts
      queryClient.invalidateQueries({
        queryKey: ['admin-workspace-detail', workspaceId],
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to restore project', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
