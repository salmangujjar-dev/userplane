import { useMemo } from 'react';

import { DEFAULT_SEARCHABLE_PROJECTS_PER_PAGE } from '@/constants/pagination';
import { useWorkspaceProjects } from '@/features/projects';
import { type SearchProject, useWorkspaceSearch } from '@/features/workspace';

import { useDebouncedValue } from './use-debounced-value';

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
      return initialProjects.data.projects || [];
    }
    return [];
  }, [searchQuery, searchResults, initialProjects]);

  return {
    projects,
    isLoading: searchQuery ? isSearching : isLoadingInitial,
  };
}
