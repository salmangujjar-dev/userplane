import { useMemo } from 'react';

import { DEFAULT_SEARCHABLE_MEMBERS_PER_PAGE } from '@/constants/pagination';

import { useDebouncedValue } from './use-debounced-value';
import { useWorkspaceMembers } from './use-workspace-members';
import { type SearchMember, useWorkspaceSearch } from './use-workspace-search';

/**
 * Hook that combines initial member list with server-side search
 * When no search query, shows initial members
 * When search query exists, uses workspace search API
 */
export function useSearchableMembers(searchQuery: string, options?: { perPage?: number }) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { perPage = DEFAULT_SEARCHABLE_MEMBERS_PER_PAGE } = options || {};

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
    if (searchQuery && searchResults?.success) {
      return (searchResults.data as SearchMember[]).map((result) => ({
        workspaceMemberId: result.workspaceMemberId,
        memberName: result.userName,
        memberEmail: result.userEmail,
        workspaceRole: result.role as 'owner' | 'admin' | 'member',
      }));
    }
    if (initialMembers?.success) {
      return initialMembers.data?.workspaceMembers || [];
    }
    return [];
  }, [searchQuery, searchResults, initialMembers]);

  return {
    members,
    isLoading: searchQuery ? isSearching : isLoadingInitial,
  };
}
