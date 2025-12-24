import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import type { Project } from '@/hooks/use-workspace-projects';

export function useCreateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.create({
        params: { workspaceId },
        body: { projectTitle: title || null },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      const previousProjects = queryClient.getQueryData(['projects', workspaceId]);

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
    onError: (error: Error, title, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
      toast.error(`Failed to create project: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Project created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useUpdateProject(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      isDefault,
    }: {
      projectId: string;
      title: string;
      isDefault?: boolean;
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.project.update({
        params: { workspaceId, projectId },
        body: {
          projectTitle: title || null,
          isDefault,
        },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onMutate: async ({ projectId, title, isDefault }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      const previousProjects = queryClient.getQueryData(['projects', workspaceId]);

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
    onError: (error: Error, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
      toast.error(`Failed to update project: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
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
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] });

      const previousProjects = queryClient.getQueryData(['projects', workspaceId]);

      queryClient.setQueryData(['projects', workspaceId], (old: Project[] | undefined) => {
        if (!old) return old;
        return old.filter((project) => project.projectId !== projectId);
      });

      return { previousProjects };
    },
    onError: (error: Error, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects);
      }
      toast.error(`Failed to delete project: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}
