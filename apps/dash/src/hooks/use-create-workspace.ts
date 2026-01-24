import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';

type CreateWorkspaceInput =
  | {
      type: 'manual';
      url: string;
    }
  | {
      type: 'invite';
      inviteToken: string;
    };

type CreateWorkspaceData =
  | {
      created: false;
      workspaceUrl?: string;
    }
  | {
      created: true;
      workspaceId: string;
      workspaceName: string;
    };

/**
 * Hook to create a new workspace
 * Supports both manual URL input and invite token flows
 * All workspaces start on free plan - users upgrade via subscription
 * Handles API call, loading states, and error handling
 */
export function useCreateWorkspace() {
  return useMutation<SafeResult<CreateWorkspaceData>, Error, CreateWorkspaceInput>({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const body =
        input.type === 'manual'
          ? {
              type: 'manual' as const,
              url: input.url.startsWith('http') ? input.url : `https://${input.url}`,
            }
          : {
              type: 'invite' as const,
              inviteToken: input.inviteToken,
            };

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
