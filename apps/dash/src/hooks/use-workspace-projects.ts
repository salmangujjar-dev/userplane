import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_PROJECTS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

export interface Project {
  projectId: string;
  projectTitle: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectSortField = 'created_at' | 'project_title';
export type SortDirection = 'asc' | 'desc';

/**
 * Hook to fetch projects for the current workspace
 * Fetches project list from API with pagination and sorting
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function ProjectSelector() {
 *   const { data, isLoading } = useWorkspaceProjects();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <select>
 *       {data.data.map(project => (
 *         <option key={project.projectId} value={project.projectId}>
 *           {project.projectTitle || 'Untitled Project'}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
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
    queryKey: ['projects', workspaceId, perPage, page, sortBy, sortDirection],
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
