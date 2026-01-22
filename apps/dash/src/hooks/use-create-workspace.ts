import { useMutation } from '@tanstack/react-query';
import type { PlanName, UserSelectablePlanId } from '@workspace/pricing';

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
      plan: UserSelectablePlanId;
    }
  | {
      type: 'invite';
      inviteToken: string;
    };

type CreateWorkspaceData =
  | {
      created: false;
      workspaceUrl?: string;
      workspacePlan?: UserSelectablePlanId;
      planName?: PlanName;
      planCycle?: 'monthly' | 'annual';
    }
  | {
      created: true;
      workspaceId: string;
      workspaceName: string;
    };

/**
 * Hook to create a new workspace
 * Supports both manual URL input (with plan) and invite token flows
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
              plan: input.plan,
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
