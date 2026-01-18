'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { authClient } from '@/client/auth';

interface ImpersonateUserParams {
  userId: string;
  userName?: string;
}

/**
 * Hook for impersonating users.
 * Provides a mutation to start impersonating a user.
 */
export function useImpersonation() {
  const queryClient = useQueryClient();

  const impersonateMutation = useMutation({
    mutationFn: async ({ userId }: ImpersonateUserParams) => {
      const result = await authClient.admin.impersonateUser({
        userId,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to impersonate user');
      }

      return result.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Now impersonating ${variables.userName || 'user'}`);
      // Invalidate all queries to refresh with the new session
      queryClient.invalidateQueries();
      // Redirect to home to start fresh with the impersonated session
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to impersonate user');
    },
  });

  return {
    impersonateUser: impersonateMutation.mutate,
    impersonateUserAsync: impersonateMutation.mutateAsync,
    isPending: impersonateMutation.isPending,
    error: impersonateMutation.error,
  };
}
