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
export function useWorkspaceProjects() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const response = await apiClient.project.list({
        params: { workspaceId },
        query: { page: 1 },
      });
      return response.data.projects;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
