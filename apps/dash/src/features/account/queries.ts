import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';

import { accountKeys } from './query-keys';

/**
 * Hook to fetch current user account information
 * Returns user name and email
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useAccount() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const [error, response] = await apiClient.account.get({});
      return handleSafeResult(error, response?.data ?? null);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
