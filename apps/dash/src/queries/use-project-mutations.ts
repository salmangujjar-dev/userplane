import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import type { Project } from '@/hooks/use-workspace-projects';
import { handleApiError, handleSafeResult, isErrorCode } from '@/lib/errors';

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

      const previousProjects = queryClient.getQueryData<Project[]>(['projects', workspaceId]);

      // Optimistically add new project
      const optimisticProject = {
        projectId: `temp-${Date.now()}`,
        projectTitle: title || null,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['projects', workspaceId], (old: Project[] | undefined) => {
        if (!old) return [optimisticProject];
        return [...old, optimisticProject];
      });

      return { previousProjects };
    },
    onSuccess: (result, title, context) => {
      if (!result.success) {
        if (context?.previousProjects) {
          queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
        }
        handleApiError(result.error, 'Failed to create project');
        return;
      }
      toast.success('Project created successfully');
    },
    onError: (error: unknown, title, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
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

      const previousProjects = queryClient.getQueryData<Project[]>(['projects', workspaceId]);

      queryClient.setQueryData(['projects', workspaceId], (old: Project[] | undefined) => {
        if (!old) return old;
        return old.map((project) =>
          project.projectId === projectId
            ? {
                ...project,
                projectTitle: title || null,
                ...(isDefault !== undefined && { isDefault }),
              }
            : project
        );
      });

      return { previousProjects };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousProjects) {
          queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
        }
        handleApiError(result.error, 'Failed to update project');
        return;
      }
      toast.success('Project updated successfully');
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
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

      const previousProjects = queryClient.getQueryData<Project[]>(['projects', workspaceId]);

      queryClient.setQueryData(['projects', workspaceId], (old: Project[] | undefined) => {
        if (!old) return old;
        return old.filter((project) => project.projectId !== projectId);
      });

      return { previousProjects };
    },
    onSuccess: (result, projectId, context) => {
      if (!result.success) {
        if (context?.previousProjects) {
          queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
        }
        // Handle last project deletion error
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
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}
