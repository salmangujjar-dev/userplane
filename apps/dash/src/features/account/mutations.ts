import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/sonner';

import { apiClient } from '@/client';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showErrorToast,
} from '@/lib/errors';
import type { AccountData, UpdateAccountData } from '@/types';

import { accountKeys } from './query-keys';

export function useUpdateAccountName(onError?: (originalName: string) => void) {
  const queryClient = useQueryClient();

  return useMutation<
    SafeResult<UpdateAccountData>,
    Error,
    string,
    { previousAccount: AccountData | undefined }
  >({
    mutationFn: async (newName: string) => {
      const [error, response] = await apiClient.account.update({
        body: { name: newName },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });
      const previousAccount = queryClient.getQueryData<AccountData>(accountKeys.all);
      queryClient.setQueryData(accountKeys.all, (old: AccountData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          userName: newName,
        };
      });
      return { previousAccount };
    },
    onSuccess: (result, newName, context) => {
      if (!result.success) {
        if (context?.previousAccount) {
          queryClient.setQueryData(accountKeys.all, context.previousAccount);
          const originalName = context.previousAccount.userName || '';
          if (onError) {
            onError(originalName);
          }
        }
        showErrorToast(result.error);
        return;
      }
      toast.success('Account name updated successfully', {
        description: 'Your profile has been updated',
      });
    },
    onError: (error: unknown, newName, context) => {
      if (context?.previousAccount) {
        queryClient.setQueryData(accountKeys.all, context.previousAccount);
        const originalName = context.previousAccount.userName || '';
        if (onError) {
          onError(originalName);
        }
      }
      handleUnknownError(error, 'Failed to update account name');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
