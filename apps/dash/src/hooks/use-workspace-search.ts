import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { handleSafeResult, type SafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

type SearchType = 'members' | 'projects' | 'domains' | 'links';

export interface SearchMember {
  workspaceMemberId: string;
  role: string;
  userName: string;
  userEmail: string;
}

export interface SearchProject {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchLink {
  linkId: string;
  linkTitle: string | null;
}

type SearchResult = SearchMember | SearchProject | SearchLink;

/**
 * Hook to search workspace entities using server-side search
 * Searches across members, projects, domains, and links
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function SearchableFilter() {
 *   const { data } = useWorkspaceSearch({
 *     query: 'john',
 *     type: 'members',
 *     limit: 5
 *   });
 *
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <div>
 *       {data?.data.map(member => (
 *         <div key={member.workspaceMemberId}>{member.userName}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkspaceSearch(options: {
  query: string;
  type: SearchType;
  limit?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { query, type, limit = 5, enabled = true } = options;

  return useQuery({
    queryKey: ['workspace-search', workspaceId, type, query, limit],
    queryFn: async (): Promise<SafeResult<SearchResult[]>> => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const [error, response] = await apiClient.workspace.search({
        params: { workspaceId },
        query: {
          q: query.trim(),
          type,
          limit,
        },
      });

      return handleSafeResult(error, (response?.data.results as SearchResult[]) ?? null);
    },
    enabled: enabled && !!workspaceId && !!query && query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}
