'use client';

import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';
import { handleSafeResult, type SafeResult } from '@/lib/errors';

export interface ResourceCounts {
  projects?: number;
  recordings?: number;
  activeRecordings?: number;
  links?: number;
  domains?: number;
  members?: number;
}

export interface WorkspaceResourceCountsData {
  workspaceId: string;
  counts: ResourceCounts;
}

export interface WorkspaceResourceCountsOptions {
  /**
   * Enable/disable the query
   * @default true
   */
  enabled?: boolean;
  /**
   * Include project counts
   * @default false
   */
  includeProjects?: boolean;
  /**
   * Include recording counts (available recordings)
   * @default false
   */
  includeRecordings?: boolean;
  /**
   * Include active recording counts (pending recordings)
   * @default false
   */
  includeActiveRecordings?: boolean;
  /**
   * Include link counts
   * @default false
   */
  includeLinks?: boolean;
  /**
   * Include domain counts
   * @default false
   */
  includeDomains?: boolean;
  /**
   * Include member counts
   * @default false
   */
  includeMembers?: boolean;
}

/**
 * Hook to fetch resource counts for the current workspace
 * Returns aggregate counts of various workspace resources with flexible query params
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function WorkspaceDashboard() {
 *   const { data, isLoading } = useWorkspaceResourceCounts({
 *     includeProjects: true,
 *     includeMembers: true,
 *     includeRecordings: true,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Projects: {data.data.counts.projects}</p>
 *       <p>Members: {data.data.counts.members}</p>
 *       <p>Recordings: {data.data.counts.recordings}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkspaceResourceCounts(
  options?: WorkspaceResourceCountsOptions
): ReturnType<typeof useQuery<SafeResult<WorkspaceResourceCountsData>>> {
  const workspaceId = useWorkspaceId();
  const {
    enabled = true,
    includeProjects = false,
    includeRecordings = false,
    includeActiveRecordings = false,
    includeLinks = false,
    includeDomains = false,
    includeMembers = false,
  } = options || {};

  return useQuery({
    queryKey: [
      'workspace-resource-counts',
      workspaceId,
      includeProjects,
      includeRecordings,
      includeActiveRecordings,
      includeLinks,
      includeDomains,
      includeMembers,
    ],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.getResourcesCount({
        params: { workspaceId },
        query: {
          include_projects: includeProjects,
          include_recordings: includeRecordings,
          include_active_recordings: includeActiveRecordings,
          include_links: includeLinks,
          include_domains: includeDomains,
          include_members: includeMembers,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
