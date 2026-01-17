import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  showErrorToast,
  type SafeResult,
} from '@/lib/errors';

interface CreateWorkspaceInput {
  url?: string;
  inviteToken?: string;
}

interface CreateWorkspaceData {
  created: boolean;
  workspaceId?: string;
  workspaceName?: string;
}

/**
 * Hook to create a new workspace
 * Supports both manual URL input and invite token flows
 * Handles API call, loading states, and error handling
 */
export function useCreateWorkspace() {
  return useMutation<SafeResult<CreateWorkspaceData>, Error, CreateWorkspaceInput>({
    mutationFn: async (input: CreateWorkspaceInput) => {
      // For invite token flow, url is optional (comes from token)
      // For manual flow, url is required
      const body: { url?: string; inviteToken?: string } = {};

      if (input.inviteToken) {
        body.inviteToken = input.inviteToken;
      }

      if (input.url) {
        body.url = input.url.startsWith('http') ? input.url : `https://${input.url}`;
      }

      const [error, response] = await apiClient.provisioner.createWorkspace({
        body,
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
      handleUnknownError(error, 'Failed to create workspace');
    },
  });
}
