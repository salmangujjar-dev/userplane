import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import type { WorkspaceBillingEmailData } from '@/hooks/use-workspace-billing-email';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type { QueryData } from '@/types';

type BillingEmailQueryData = QueryData<WorkspaceBillingEmailData>;

export function useUpdateWorkspaceBillingEmail(options?: {
  onError?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<WorkspaceBillingEmailData>,
    Error,
    { workspaceId: string; email: string },
    { previousBillingEmail: BillingEmailQueryData | undefined }
  >({
    mutationFn: async ({ workspaceId, email }) => {
      const [error, response] = await apiClient.workspace.updateWorkspaceBillingEmail({
        params: { workspaceId },
        body: { email },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async ({ workspaceId, email }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-billing-email', workspaceId] });

      const previousBillingEmail = queryClient.getQueryData<BillingEmailQueryData>([
        'workspace-billing-email',
        workspaceId,
      ]);

      queryClient.setQueryData<BillingEmailQueryData>(
        ['workspace-billing-email', workspaceId],
        (old) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaceBillingEmail: email,
            },
          };
        }
      );

      return { previousBillingEmail };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context?.previousBillingEmail) {
          queryClient.setQueryData(
            ['workspace-billing-email', variables.workspaceId],
            context.previousBillingEmail
          );
        }
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Billing email updated');
      options?.onSuccess?.();
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousBillingEmail) {
        queryClient.setQueryData(
          ['workspace-billing-email', variables.workspaceId],
          context.previousBillingEmail
        );
      }
      handleUnknownError(error, 'Failed to update billing email');
      options?.onError?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-billing-email', variables.workspaceId],
      });
    },
  });
}
