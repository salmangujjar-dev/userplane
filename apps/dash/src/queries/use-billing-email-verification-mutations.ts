import { useMutation } from '@tanstack/react-query';
import {
  RequestBillingEmailChangeDataSchema,
  VerifyBillingEmailChangeDataSchema,
} from '@workspace/contract';
import { toast } from 'sonner';
import type { z } from 'zod';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';

export type RequestBillingEmailChangeData = z.infer<typeof RequestBillingEmailChangeDataSchema>;
export type VerifyBillingEmailChangeData = z.infer<typeof VerifyBillingEmailChangeDataSchema>;

export function useRequestBillingEmailChange(options?: {
  onError?: () => void;
  onSuccess?: () => void;
}) {
  return useMutation<
    SafeResult<RequestBillingEmailChangeData>,
    Error,
    { workspaceId: string; email: string }
  >({
    mutationFn: async ({ workspaceId, email }) => {
      const [error, response] = await apiClient.workspace.requestBillingEmailChange({
        params: { workspaceId },
        body: { email },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Verification email sent. Please check your inbox.');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to request billing email change');
      options?.onError?.();
    },
  });
}

export function useVerifyBillingEmailChange(options?: {
  onError?: () => void;
  onSuccess?: (data: VerifyBillingEmailChangeData) => void;
}) {
  return useMutation<SafeResult<VerifyBillingEmailChangeData>, Error, { token: string }>({
    mutationFn: async ({ token }) => {
      const [error, response] = await apiClient.workspace.verifyBillingEmailChange({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        options?.onError?.();
        return;
      }
      toast.success('Billing email updated successfully');
      options?.onSuccess?.(result.data);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to verify billing email change');
      options?.onError?.();
    },
  });
}
