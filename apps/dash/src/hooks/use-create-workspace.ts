import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from 'sonner';

interface CreateWorkspaceInput {
  url: string;
}

interface CreateWorkspaceResponse {
  data: {
    workspaceId: string;
  };
}

/**
 * Hook to create a new workspace
 * Handles API call, loading states, and error handling
 */
export function useCreateWorkspace() {
  return useMutation<CreateWorkspaceResponse, Error, CreateWorkspaceInput>({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const fullUrl = input.url.startsWith('http') ? input.url : `https://${input.url}`;

      const [error, response] = await apiClient.provisioner.createWorkspace({
        body: {
          url: fullUrl,
        },
      });

      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response;
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace', {
        description: error.message || 'Please try again later.',
      });
    },
  });
}
