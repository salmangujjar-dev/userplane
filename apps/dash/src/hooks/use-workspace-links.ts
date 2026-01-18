import { useQuery } from '@tanstack/react-query';
import type { LinkProviderType, LinkType } from '@workspace/contract';

import { apiClient } from '@/client';
import { DEFAULT_LINKS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

export interface LinkDomain {
  domainId: string;
  url: string;
  status: string;
}

export interface LinkProject {
  projectId: string;
  title: string | null;
}

export interface LinkCreator {
  workspaceMemberId: string;
  name: string;
}

export interface Link {
  linkId: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType;
  linkProviderId: string | null;
  linkProviderReference: string | null;
  linkURL: string;
  createdAt: string | Date;
  project: LinkProject;
  creator: LinkCreator;
  domain: LinkDomain;
}

export interface LinksFilters {
  createdBy?: string[];
  projectId?: string[];
  domainId?: string[];
  linkProviderType?: LinkProviderType[];
  linkType?: LinkType;
  sortBy?: 'created_at' | 'link_title';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LinksData {
  workspaceId: string;
  links: Link[];
  pagination: PaginationMeta;
}

/**
 * Hook to fetch links for the current workspace
 * Supports pagination and filtering
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function LinksList() {
 *   const { data, isLoading } = useWorkspaceLinks({
 *     page: 1,
 *     perPage: 10,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <div>
 *       {data.data.links?.map(link => (
 *         <div key={link.linkId}>{link.linkTitle}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
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
    queryKey: [
      'links',
      workspaceId,
      page,
      perPage,
      filters.createdBy,
      filters.projectId,
      filters.domainId,
      filters.linkProviderType,
      filters.linkType,
      filters.sortBy,
      filters.sortDirection,
    ],
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
