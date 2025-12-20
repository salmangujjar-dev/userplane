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
      const [error, data] = await apiClient.account.get({});
      if (error) throw error;
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
