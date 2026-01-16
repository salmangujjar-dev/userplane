import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, type SafeResult } from '@/lib/errors';

interface WorkspaceData {
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
}

interface UpdateWorkspaceNameData {
  workspaceName: string;
}

export function useUpdateWorkspaceName(
  workspaceId: string | null,
  onError?: (originalName: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateWorkspaceNameData>,
    Error,
    string,
    { previousWorkspace: WorkspaceData | undefined }
  >({
    mutationFn: async (newName: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      const [error, response] = await apiClient.workspace.updateName({
        params: { workspaceId },
        body: { name: newName },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: ['workspace', workspaceId] });
      const previousWorkspace = queryClient.getQueryData<WorkspaceData>(['workspace', workspaceId]);
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
    onSuccess: (result, newName, context) => {
      if (!result.success) {
        if (context?.previousWorkspace) {
          queryClient.setQueryData(['workspace', workspaceId], context.previousWorkspace);
          const originalName = context.previousWorkspace.workspace?.workspaceName || '';
          if (onError) {
            onError(originalName);
          }
        }
        handleApiError(result.error, 'Failed to update workspace name');
        return;
      }
      toast.success('Workspace name updated successfully');
    },
    onError: (error: unknown, newName, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(['workspace', workspaceId], context.previousWorkspace);
        const originalName = context.previousWorkspace.workspace?.workspaceName || '';
        if (onError) {
          onError(originalName);
        }
      }
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      // Also invalidate workspaces list so sidebar updates
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
