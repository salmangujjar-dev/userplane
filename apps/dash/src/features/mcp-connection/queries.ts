import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_MCP_CONNECTIONS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';

import { mcpConnectionKeys } from './query-keys';

/**
 * Hook to fetch the current user's authorized MCP connections with pagination.
 */
export function useMcpConnections(options?: { perPage?: number; page?: number }) {
  const { perPage = DEFAULT_MCP_CONNECTIONS_PER_PAGE, page = 1 } = options || {};

  return useQuery({
    queryKey: mcpConnectionKeys.list({ page, perPage }),
    queryFn: async () => {
      const [error, response] = await apiClient.mcpConnection.list({
        query: { page, per_page: perPage },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
