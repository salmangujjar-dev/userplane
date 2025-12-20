import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

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
 * @example
 * ```tsx
 * function ProjectSelector() {
 *   const { data: projects, isLoading } = useWorkspaceProjects();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <select>
 *       {projects?.map(project => (
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
  const { perPage = 5, enabled = true } = options || {};

  return useQuery({
    queryKey: ['projects', workspaceId, perPage],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, data] = await apiClient.project.list({
        params: { workspaceId },
        query: { page: 1, per_page: perPage },
      });
      if (error) throw error;
      return data.data.projects;
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
