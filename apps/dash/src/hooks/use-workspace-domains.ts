import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleQueryResult } from '@/lib/errors';
import { DEFAULT_DOMAINS_PER_PAGE } from '@/constants/pagination';

export interface WorkspaceDomain {
  domainId: string;
  domainUrl: string;
  domainStatus: 'pending' | 'verified' | 'revoked';
}

export type DomainSortField = 'created_at' | 'domain_url';
export type SortDirection = 'asc' | 'desc';

/**
 * Hook to fetch domains for the current workspace
 * Returns list of domains with their verification status
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function DomainSelector() {
 *   const { data, isLoading } = useWorkspaceDomains();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <select>
 *       {data.data.map(domain => (
 *         <option key={domain.domainId} value={domain.domainId}>
 *           {domain.domainUrl}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useWorkspaceDomains(options?: {
  perPage?: number;
  page?: number;
  sortBy?: DomainSortField;
  sortDirection?: SortDirection;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    perPage = DEFAULT_DOMAINS_PER_PAGE,
    page = 1,
    sortBy = 'created_at',
    sortDirection = 'desc',
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: ['domains', workspaceId, perPage, page, sortBy, sortDirection],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.domains.list({
        params: { workspaceId },
        query: { page, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection },
      });

      return handleQueryResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
