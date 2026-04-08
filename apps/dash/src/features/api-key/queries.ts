import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult } from '@/lib/errors';
import type { ApiKeyData } from '@/types';

import { apiKeyKeys } from './query-keys';

/**
 * Hook to fetch the current user's API keys.
 *
 * Returns SafeResult<ApiKeyData[]>:
 * - success + data: array of keys (may be empty)
 * - failure: unexpected API error
 */
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.all,
    queryFn: async () => {
      const [error, response] = await apiClient.apiKey.list({});
      return handleSafeResult(error, (response?.data?.keys as ApiKeyData[]) ?? []);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
