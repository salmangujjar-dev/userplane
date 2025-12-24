import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';
import { apiClient } from '@/client';
import { handleSafeResult, handleApiError, type SafeResult } from '@/lib/errors';

interface CreateWorkspaceInput {
  url: string;
}

interface CreateWorkspaceData {
  workspaceId: string;
}

/**
 * Hook to create a new workspace
 * Handles API call, loading states, and error handling
 */
export function useCreateWorkspace() {
  return useMutation<SafeResult<CreateWorkspaceData>, Error, CreateWorkspaceInput>({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const fullUrl = input.url.startsWith('http') ? input.url : `https://${input.url}`;

      const [error, response] = await apiClient.provisioner.createWorkspace({
        body: {
          url: fullUrl,
        },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        handleApiError(result.error, 'Failed to create workspace');
        return;
      }
    },
    onError: (error: unknown) => {
      // Only unknown errors reach here (will trigger Sentry)
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
