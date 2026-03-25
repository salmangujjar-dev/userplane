import { useQuery } from '@tanstack/react-query';
import type { SortDirection } from '@userplane/contract';

import { apiClient } from '@/client';
import { DEFAULT_PROJECTS_PER_PAGE } from '@/constants';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { projectKeys } from './query-keys';

type ProjectSortField = 'created_at' | 'project_title';

export function useWorkspaceProjects(options?: {
  perPage?: number;
  page?: number;
  sortBy?: ProjectSortField;
  sortDirection?: SortDirection;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    perPage = DEFAULT_PROJECTS_PER_PAGE,
    page = 1,
    sortBy = 'created_at',
    sortDirection = 'desc',
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: projectKeys.list(workspaceId ?? '', {
      page,
      perPage,
      sort: { by: sortBy, direction: sortDirection },
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.project.list({
        params: { workspaceId },
        query: { page, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
