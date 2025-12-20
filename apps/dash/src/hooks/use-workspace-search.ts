import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

type SearchType = 'members' | 'projects' | 'domains' | 'links';

export interface SearchMember {
  workspaceMemberId: string;
  role: string;
  userName: string;
  userEmail: string;
}

export interface SearchProject {
  projectId: string;
  projectTitle: string | null;
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
 * @example
 * ```tsx
 * function SearchableFilter() {
 *   const { data: results } = useWorkspaceSearch({
 *     query: 'john',
 *     type: 'members',
 *     limit: 5
 *   });
 *
 *   return (
 *     <div>
 *       {results?.map(member => (
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
    queryFn: async (): Promise<SearchResult[]> => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      if (!query || query.trim().length === 0) {
        return [];
      }

      const response = await apiClient.workspace.search({
        params: { workspaceId },
        query: {
          q: query.trim(),
          type,
          limit,
        },
      });

      return response.data.results as SearchResult[];
    },
    enabled: enabled && !!workspaceId && !!query && query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}
