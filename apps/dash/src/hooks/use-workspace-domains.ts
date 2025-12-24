import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

export interface WorkspaceDomain {
  domainId: string;
  domainUrl: string;
  domainStatus: 'pending' | 'verified' | 'revoked';
}

/**
 * Hook to fetch domains for the current workspace
 * Returns list of domains with their verification status
 *
 * @example
 * ```tsx
 * function DomainSelector() {
 *   const { data: domains, isLoading } = useWorkspaceDomains();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <select>
 *       {domains?.map(domain => (
 *         <option key={domain.domainId} value={domain.domainId}>
 *           {domain.domainUrl}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useWorkspaceDomains(options?: { perPage?: number; enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { perPage = 10, enabled = true } = options || {};

  return useQuery({
    queryKey: ['domains', workspaceId, perPage],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.domains.list({
        params: { workspaceId },
        query: { page: 1, per_page: perPage },
      });

      if (error) {
        console.log('error: ', error);
        throw error;
      }
      return response.data.domains;
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
