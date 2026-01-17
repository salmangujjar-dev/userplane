'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleSafeResult } from '@/lib/errors';

/**
 * Hook to validate an access request token and get request details
 * Returns SafeResult - check result.success before using data
 */
export function useValidateAccessRequest(token: string | null) {
  return useQuery({
    queryKey: ['access-request', 'validate', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('No token provided');
      }
      const [error, response] = await apiClient.workspace.accessRequest.validate({
        query: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to approve an access request
 * Returns SafeResult - check result.success in onSuccess callback
 */
export function useApproveAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const [error, response] = await apiClient.workspace.accessRequest.approve({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Access request approved');
        queryClient.invalidateQueries({ queryKey: ['access-request'] });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to approve access request';
      toast.error(message);
    },
  });
}

/**
 * Hook to decline an access request
 * Returns SafeResult - check result.success in onSuccess callback
 */
export function useDeclineAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const [error, response] = await apiClient.workspace.accessRequest.decline({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Access request declined');
        queryClient.invalidateQueries({ queryKey: ['access-request'] });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to decline access request';
      toast.error(message);
    },
  });
}
