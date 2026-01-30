import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type { ProjectRestoreData, RestorationStatus } from '@/types';
import type { ProjectsData, QueryData, QuerySnapshot } from '@/types';

import { workspaceKeys } from '../workspace/query-keys';
import type { Project } from './queries';
import { projectKeys } from './query-keys';

type ProjectsQueryData = QueryData<ProjectsData>;

export function useCreateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.create({
        params: { workspaceId },
        body: { projectTitle: title || null },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (title: string) => {
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
    onSuccess: (result, title, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        showErrorToast(result.error);
        return;
      }
      toast.success('Project created successfully');
    },
    onError: (error: unknown, title, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process project operation');
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
}

export function useUpdateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, title, isDefault }: UpdateProjectInput) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.update({
        params: { workspaceId, projectId },
        body: {
          projectTitle: title || 'Untitled Project',
          isDefault,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ projectId, title, isDefault }: UpdateProjectInput) => {
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Project updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process project operation');
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
        showErrorToast(result.error);
        return;
      }
      toast.success('Project deleted successfully');
    },
    onError: (error: unknown, projectId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      handleUnknownError(error, 'Failed to process project operation');
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
  return useMutation<SafeResult<ProjectRestoreData>, Error, RestoreProjectInput>({
    mutationFn: async (input: RestoreProjectInput) => {
      const [error, response] = await apiClient.project.restore({
        params: { workspaceId: input.workspaceId, projectId: input.projectId },
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
      handleUnknownError(error, 'Failed to restore project');
    },
  });
}

// Re-export types
export type { RestorationStatus };
