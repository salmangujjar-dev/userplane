import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import type { Project } from '@/hooks/use-workspace-projects';
import { handleApiError, handleSafeResult, isErrorCode, type SafeResult } from '@/lib/errors';

interface ProjectsData {
  projects: Project[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

type ProjectsQueryData = SafeResult<ProjectsData>;
type QuerySnapshot = [queryKey: readonly unknown[], data: ProjectsQueryData | undefined][];

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
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<ProjectsQueryData>({
        queryKey: ['projects', workspaceId],
      });

      const optimisticProject: Project = {
        projectId: `temp-${Date.now()}`,
        projectTitle: title || null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>(
        { queryKey: ['projects', workspaceId] },
        (old) => {
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
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, title, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        handleApiError(result.error, 'Failed to create project');
        return;
      }
      toast.success('Project created successfully');
    },
    onError: (error: unknown, title, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
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
          projectTitle: title || null,
          isDefault,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ projectId, title, isDefault }: UpdateProjectInput) => {
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<ProjectsQueryData>({
        queryKey: ['projects', workspaceId],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>(
        { queryKey: ['projects', workspaceId] },
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              projects: old.data.projects.map((project) =>
                project.projectId === projectId
                  ? {
                      ...project,
                      projectTitle: title || null,
                      ...(isDefault !== undefined && { isDefault }),
                    }
                  : project
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
        handleApiError(result.error, 'Failed to update project');
        return;
      }
      toast.success('Project updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
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
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      // Snapshot ALL matching queries for rollback
      const previousQueries: QuerySnapshot = queryClient.getQueriesData<ProjectsQueryData>({
        queryKey: ['projects', workspaceId],
      });

      // Update ALL matching queries
      queryClient.setQueriesData<ProjectsQueryData>(
        { queryKey: ['projects', workspaceId] },
        (old) => {
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
        }
      );

      return { previousQueries };
    },
    onSuccess: (result, projectId, context) => {
      if (!result.success) {
        // Rollback all queries
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        if (isErrorCode(result.error, 'PROJECT_LAST_PROJECT_DELETE_FORBIDDEN')) {
          toast.error("Can't delete the only project", {
            description: 'Create another project first.',
          });
          return;
        }
        handleApiError(result.error, 'Failed to delete project');
        return;
      }
      toast.success('Project deleted successfully');
    },
    onError: (error: unknown, projectId, context) => {
      // Rollback all queries
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}
