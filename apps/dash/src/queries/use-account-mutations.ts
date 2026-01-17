import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import {
  handleSafeResult,
  handleUnknownError,
  showErrorToast,
  type SafeResult,
} from '@/lib/errors';
import type { AccountData, UpdateAccountData } from '@/lib/types';

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
      await queryClient.cancelQueries({ queryKey: ['account'] });
      const previousAccount = queryClient.getQueryData<AccountData>(['account']);
      queryClient.setQueryData(['account'], (old: AccountData | undefined) => {
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
          queryClient.setQueryData(['account'], context.previousAccount);
          const originalName = context.previousAccount.userName || '';
          if (onError) {
            onError(originalName);
          }
        }
        showErrorToast(result.error);
        return;
      }
      toast.success('Account name updated successfully');
    },
    onError: (error: unknown, newName, context) => {
      if (context?.previousAccount) {
        queryClient.setQueryData(['account'], context.previousAccount);
        const originalName = context.previousAccount.userName || '';
        if (onError) {
          onError(originalName);
        }
      }
      handleUnknownError(error, 'Failed to update account name');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
