import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client';

/**
 * Hook to fetch current user account information
 * Returns user name and email
 */
export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const response = await apiClient.account.get({});
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
