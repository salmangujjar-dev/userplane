import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

interface WorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
}

export function useUpdateWorkspaceName(
  workspaceId: string | null,
  onError?: (originalName: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newName: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.updateName({
        params: { workspaceId },
        body: { name: newName },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: ['workspace', workspaceId] });
      const previousWorkspace = queryClient.getQueryData(['workspace', workspaceId]);
      queryClient.setQueryData(['workspace', workspaceId], (old: WorkspaceData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          workspace: {
            ...old.workspace,
            workspaceName: newName,
          },
        };
      });
      return { previousWorkspace };
    },
    onError: (error: Error, newName, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(['workspace', workspaceId], context.previousWorkspace);
        const originalName =
          (context.previousWorkspace as WorkspaceData)?.workspace?.workspaceName || '';
        if (onError) {
          onError(originalName);
        }
      }
      toast.error(`Failed to update workspace name: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Workspace name updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });
}
