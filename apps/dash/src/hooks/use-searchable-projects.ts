import { useMemo } from 'react';
import { useWorkspaceProjects } from './use-workspace-projects';
import { useWorkspaceSearch, type SearchProject } from './use-workspace-search';
import { useDebouncedValue } from './use-debounced-value';
import { DEFAULT_SEARCHABLE_PROJECTS_PER_PAGE } from '@/constants/pagination';

/**
 * Hook that combines initial project list with server-side search
 * When no search query, shows initial projects
 * When search query exists, uses workspace search API
 */
export function useSearchableProjects(searchQuery: string, options?: { perPage?: number }) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const { perPage = DEFAULT_SEARCHABLE_PROJECTS_PER_PAGE } = options || {};

  const { data: initialProjects, isLoading: isLoadingInitial } = useWorkspaceProjects({
    perPage,
    enabled: !searchQuery,
  });

  const { data: searchResults, isLoading: isSearching } = useWorkspaceSearch({
    query: debouncedQuery,
    type: 'projects',
    limit: perPage,
    enabled: !!searchQuery,
  });

  const projects = useMemo(() => {
    if (searchQuery && searchResults?.success) {
      return searchResults.data as SearchProject[];
    }
    if (initialProjects?.success) {
      return initialProjects.data || [];
    }
    return [];
  }, [searchQuery, searchResults, initialProjects]);

  return {
    projects,
    isLoading: searchQuery ? isSearching : isLoadingInitial,
  };
}
