import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

interface AccountData {
  userName: string;
  userEmail: string;
}

export function useUpdateAccountName(onError?: (originalName: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newName: string) => {
      const [error, response] = await apiClient.account.update({
        body: { name: newName },
      });
      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data;
    },
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: ['account'] });
      const previousAccount = queryClient.getQueryData(['account']);
      queryClient.setQueryData(['account'], (old: AccountData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          userName: newName,
        };
      });
      return { previousAccount };
    },
    onError: (error: Error, newName, context) => {
      if (context?.previousAccount) {
        queryClient.setQueryData(['account'], context.previousAccount);
        const originalName = (context.previousAccount as AccountData)?.userName || '';
        if (onError) {
          onError(originalName);
        }
      }
      toast.error(`Failed to update account name: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Account name updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
