import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleQueryResult } from '@/lib/errors';
import { DEFAULT_PROJECTS_PER_PAGE } from '@/constants/pagination';

export interface Project {
  projectId: string;
  projectTitle: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook to fetch projects for the current workspace
 * Fetches project list from API with pagination
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
export function useWorkspaceProjects(options?: { perPage?: number; enabled?: boolean }) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_PROJECTS_PER_PAGE, enabled = true } = options || {};

  return useQuery({
    queryKey: ['projects', workspaceId, perPage],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.project.list({
        params: { workspaceId },
        query: { page: 1, per_page: perPage },
      });
      return handleQueryResult(error, response?.data.projects ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
