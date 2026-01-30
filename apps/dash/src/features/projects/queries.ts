import { useQuery } from '@tanstack/react-query';
import type { ProjectRestoreInfoData } from '@workspace/contract';

import { apiClient } from '@/client';
import { DEFAULT_PROJECTS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { projectKeys } from './query-keys';

// Re-export types for consumers
export interface Project {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectSortField = 'created_at' | 'project_title';
export type SortDirection = 'asc' | 'desc';

/**
 * Hook to fetch projects for the current workspace
 * Fetches project list from API with pagination and sorting
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceProjects(options?: {
  perPage?: number;
  page?: number;
  sortBy?: ProjectSortField;
  sortDirection?: SortDirection;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    perPage = DEFAULT_PROJECTS_PER_PAGE,
    page = 1,
    sortBy = 'created_at',
    sortDirection = 'desc',
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: projectKeys.list(workspaceId ?? '', {
      page,
      perPage,
      sort: { by: sortBy, direction: sortDirection },
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.project.list({
        params: { workspaceId },
        query: { page, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single project by ID
 * Returns project details including title and settings
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useProject(projectId: string, options?: { enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: projectKeys.detail(workspaceId ?? '', projectId),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.project.getById({
        params: { workspaceId, projectId },
      });
      return handleSafeResult(error, response?.data.project ?? null);
    },
    enabled: enabled && !!workspaceId && !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch project restore information
 * Returns details about a deleted project that can be restored
 */
export function useProjectRestoreInfo(workspaceId: string | null, projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.restoreInfo(workspaceId ?? '', projectId ?? ''),
    queryFn: async () => {
      if (!workspaceId || !projectId) {
        throw new Error('Workspace ID and Project ID are required');
      }
      const [error, response] = await apiClient.project.getRestoreInfo({
        params: { workspaceId, projectId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId && !!projectId,
    retry: false,
  });
}

// Re-export types from contract for convenience
export type { ProjectRestoreInfoData };
