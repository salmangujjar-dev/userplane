import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_LINKS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';
import type {
  Link,
  LinkDomain,
  LinkProject,
  LinkProviderType,
  LinksData,
  LinkType,
  SortDirection,
} from '@/types';

import { linkKeys } from './query-keys';

// Re-export types for consumers
export type { Link, LinkDomain, LinkProject, LinksData };

export interface LinksFilters {
  createdBy?: string[];
  projectId?: string[];
  domainId?: string[];
  linkProviderType?: LinkProviderType[];
  linkType?: LinkType;
  sortBy?: 'created_at' | 'link_title';
  sortDirection?: SortDirection;
}

/**
 * Hook to fetch links for the current workspace
 * Supports pagination and filtering
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceLinks(options?: {
  page?: number;
  perPage?: number;
  filters?: LinksFilters;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    page = 1,
    perPage = DEFAULT_LINKS_PER_PAGE,
    filters = {},
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: linkKeys.list(workspaceId ?? '', {
      page,
      perPage,
      filters: {
        createdBy: filters.createdBy,
        projectId: filters.projectId,
        domainId: filters.domainId,
        linkProviderType: filters.linkProviderType,
        linkType: filters.linkType,
      },
      sort: {
        by: filters.sortBy,
        direction: filters.sortDirection,
      },
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.link.list({
        params: { workspaceId },
        query: {
          page,
          per_page: perPage,
          created_by: filters.createdBy,
          project_id: filters.projectId,
          domain_id: filters.domainId,
          link_provider_type: filters.linkProviderType,
          link_type: filters.linkType,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection,
        },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
