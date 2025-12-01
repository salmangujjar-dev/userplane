import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace';
import { fetchWorkspaceProjects, type Project } from '@/lib/workspace-api';

/**
 * Hook to fetch projects for the current workspace
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
 *         <option key={project.id} value={project.id}>
 *           {project.title}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useWorkspaceProjects() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      return fetchWorkspaceProjects(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
