import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RetentionDays } from '@workspace/contract';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToastToast,
} from '@/lib/errors';
import { showCreatedToast, showDeletedToast, showUpdatedToast } from '@/lib/toasts';
import type { ProjectRestoreData, RestorationStatus } from '@/types';
import type { ProjectsData, QueryData, QuerySnapshot } from '@/types';

import { workspaceKeys } from '../workspace/query-keys';
import type { Project } from './queries';
import { projectKeys } from './query-keys';

type ProjectsQueryData = QueryData<ProjectsData>;

interface CreateProjectInput {
  title: string;
  recordingRetentionDays?: RetentionDays;
}

export function useCreateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, recordingRetentionDays }: CreateProjectInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.create({
        params: { workspaceId },
        body: { projectTitle: title || null, recordingRetentionDays },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ title, recordingRetentionDays }: CreateProjectInput) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<ProjectsQueryData> =
        queryClient.getQueriesData<ProjectsQueryData>({
          queryKey: projectKeys.lists(),
        });

      const optimisticProject: Project = {
        projectId: `temp-${Date.now()}`,
        projectTitle: title || 'Untitled Project',
        isDefault: false,
        recordingRetentionDays: recordingRetentionDays ?? 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>({ queryKey: projectKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            projects: [...old.data.projects, optimisticProject],
            pagination: {
              ...old.data.pagination,
              total: old.data.pagination.total + 1,
            },
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, _input, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showErrorToastToast(result.error);
        return;
      }
      showCreatedToast('Project', 'Your project is ready');
    },
    onError: (error: unknown, _input, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to create project');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

interface UpdateProjectInput {
  projectId: string;
  title: string;
  isDefault?: boolean;
  recordingRetentionDays?: RetentionDays;
}

export function useUpdateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      isDefault,
      recordingRetentionDays,
    }: UpdateProjectInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.update({
        params: { workspaceId, projectId },
        body: {
          projectTitle: title || 'Untitled Project',
          isDefault,
          recordingRetentionDays,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({
      projectId,
      title,
      isDefault,
      recordingRetentionDays,
    }: UpdateProjectInput) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<ProjectsQueryData> =
        queryClient.getQueriesData<ProjectsQueryData>({
          queryKey: projectKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>({ queryKey: projectKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            projects: old.data.projects.map((project) => {
              if (project.projectId === projectId) {
                return {
                  ...project,
                  projectTitle: title || 'Untitled Project',
                  ...(isDefault !== undefined && { isDefault }),
                  ...(recordingRetentionDays !== undefined && { recordingRetentionDays }),
                };
              }
              // When setting this project as default, unset all others
              if (isDefault === true && project.isDefault) {
                return {
                  ...project,
                  isDefault: false,
                };
              }
              return project;
            }),
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showErrorToastToast(result.error);
        return;
      }
      showUpdatedToast('Project');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to update project');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

export function useDeleteProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.delete({
        params: { workspaceId, projectId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (projectId: string) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot<ProjectsQueryData> =
        queryClient.getQueriesData<ProjectsQueryData>({
          queryKey: projectKeys.lists(),
        });

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>({ queryKey: projectKeys.lists() }, (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          data: {
            ...old.data,
            projects: old.data.projects.filter((project) => project.projectId !== projectId),
            pagination: {
              ...old.data.pagination,
              total: Math.max(0, old.data.pagination.total - 1),
            },
          },
        };
      });

      return { previousQueries };
    },
    onSuccess: (result, projectId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showErrorToastToast(result.error);
        return;
      }
      showDeletedToast('Project', 'Project has been permanently removed');
    },
    onError: (error: unknown, projectId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to delete project');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.resourceCounts(workspaceId ?? '') });
    },
  });
}

// ============================================
// PROJECT RESTORE
// ============================================

interface RestoreProjectInput {
  workspaceId: string;
  projectId: string;
}

/**
 * Hook to restore a deleted project
 * Restores project within its workspace
 */
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<ProjectRestoreData>, Error, RestoreProjectInput>({
    mutationFn: async (input: RestoreProjectInput) => {
      const [error, response] = await apiClient.project.restore({
        params: { workspaceId: input.workspaceId, projectId: input.projectId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result, input) => {
      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(input.workspaceId),
      });
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to restore project');
    },
  });
}

// Re-export types
export type { RestorationStatus };
