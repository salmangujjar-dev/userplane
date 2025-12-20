import { useMemo } from 'react';
import { useWorkspaceMembers } from './use-workspace-members';
import { useWorkspaceSearch, type SearchMember } from './use-workspace-search';
import { useDebouncedValue } from './use-debounced-value';

/**
 * Hook that combines initial member list with server-side search
 * When no search query, shows initial members
 * When search query exists, uses workspace search API
 */
export function useSearchableMembers(searchQuery: string, options?: { perPage?: number }) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { perPage = 5 } = options || {};

  const { data: initialMembers, isLoading: isLoadingInitial } = useWorkspaceMembers({
    perPage,
    enabled: !searchQuery,
  });

  const { data: searchResults, isLoading: isSearching } = useWorkspaceSearch({
    query: debouncedQuery,
    type: 'members',
    limit: perPage,
    enabled: !!searchQuery,
  });

  const members = useMemo(() => {
    if (searchQuery && searchResults) {
      return (searchResults as SearchMember[]).map((result) => ({
        workspaceMemberId: result.workspaceMemberId,
        memberName: result.userName,
        memberEmail: result.userEmail,
        workspaceRole: result.role as 'owner' | 'admin' | 'member',
      }));
    }
    return initialMembers || [];
  }, [searchQuery, searchResults, initialMembers]);

  return {
    members,
    isLoading: searchQuery ? isSearching : isLoadingInitial,
  };
}
