/**
 * Query key factory for project-related queries
 *
 * Structure:
 * - all: Base key for all project queries
 * - details(): All detail queries
 * - detail(workspaceId, projectId): Specific project detail
 * - lists(): All list queries
 * - list(workspaceId, options): Specific list configuration
 *
 * Why this structure:
 * - Separates 'detail' vs 'list' for targeted invalidations
 * - Groups pagination and sort options into objects
 * - Enables invalidating all project lists vs specific configurations
 */
export const projectKeys = {
  all: ['projects'] as const,

  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (workspaceId: string, projectId: string) =>
    [...projectKeys.details(), workspaceId, projectId] as const,

  lists: () => [...projectKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      sort?: {
        by?: 'created_at' | 'project_title';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...projectKeys.lists(), workspaceId, options] as const,
  // Restore info
  restoreInfo: (workspaceId: string, projectId: string) =>
    [...projectKeys.all, 'restore-info', workspaceId, projectId] as const,
} as const;

// Type helpers for query key inference
export type ProjectKeys = typeof projectKeys;
