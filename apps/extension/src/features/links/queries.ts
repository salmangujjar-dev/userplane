import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  LinkDomain,
  LinkItem,
  LinkProject,
  LinkProviderType,
  LinksListData,
  LinkType,
  SortDirection,
} from '@userplane/contract';

import { apiClient } from '@/client';
import { DEFAULT_LINKS_PER_PAGE } from '@/constants';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { linkKeys } from './query-keys';

export type Link = LinkItem;
export type LinksData = LinksListData;
export type { LinkDomain, LinkProject };

export interface LinksFilters {
  createdBy?: string[];
  projectId?: string[];
  domainId?: string[];
  linkProviderType?: LinkProviderType[];
  linkType?: LinkType;
  sortBy?: 'created_at' | 'link_title';
  sortDirection?: SortDirection;
}

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
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useInfiniteWorkspaceLinks(options?: {
  perPage?: number;
  filters?: LinksFilters;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_LINKS_PER_PAGE, filters = {}, enabled = true } = options || {};

  return useInfiniteQuery({
    queryKey: linkKeys.infiniteList(workspaceId ?? '', {
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
    queryFn: async ({ pageParam }) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.link.list({
        params: { workspaceId },
        query: {
          page: pageParam,
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
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.success) return undefined;
      return lastPage.data.pagination.hasMore ? lastPage.data.pagination.page + 1 : undefined;
    },
    enabled: enabled && !!workspaceId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
