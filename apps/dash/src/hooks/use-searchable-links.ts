import { useMemo } from 'react';
import { useWorkspaceLinks } from './use-workspace-links';
import { useWorkspaceSearch, type SearchLink } from './use-workspace-search';
import { useDebouncedValue } from './use-debounced-value';

/**
 * Hook that combines initial link list with server-side search
 * When no search query, shows initial links
 * When search query exists, uses workspace search API
 */
export function useSearchableLinks(searchQuery: string, options?: { perPage?: number }) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { perPage = 5 } = options || {};

  const { data: initialLinks, isLoading: isLoadingInitial } = useWorkspaceLinks({
    perPage,
    enabled: !searchQuery,
  });

  const { data: searchResults, isLoading: isSearching } = useWorkspaceSearch({
    query: debouncedQuery,
    type: 'links',
    limit: perPage,
    enabled: !!searchQuery,
  });

  const links = useMemo(() => {
    if (searchQuery && searchResults?.success) {
      return searchResults.data as SearchLink[];
    }
    if (initialLinks?.success) {
      return initialLinks.data.links || [];
    }
    return [];
  }, [searchQuery, searchResults, initialLinks]);

  return {
    links,
    isLoading: searchQuery ? isSearching : isLoadingInitial,
  };
}
