import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleApiError, handleSafeResult, type SafeResult } from '@/lib/errors';

interface AccountData {
  userName: string;
  userEmail: string;
}

interface UpdateAccountData {
  userName: string;
}

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
        handleApiError(result.error, 'Failed to update account name');
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
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
