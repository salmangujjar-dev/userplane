import type { LinkProviderType, LinkType } from '@workspace/contract';

/**
 * Query key factory for link-related queries
 *
 * Structure:
 * - all: Base key for all link queries
 * - lists(): All list queries
 * - list(workspaceId, options): Specific list configuration with filters
 *
 * Why this structure:
 * - Groups complex filter parameters into a structured object
 * - Enables invalidating all link lists vs specific filter configurations
 * - Separates pagination from filtering for cleaner API
 */
export const linkKeys = {
  all: ['links'] as const,

  lists: () => [...linkKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      filters?: {
        createdBy?: string[];
        projectId?: string[];
        domainId?: string[];
        linkProviderType?: LinkProviderType[];
        linkType?: LinkType;
      };
      sort?: {
        by?: 'created_at' | 'link_title';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...linkKeys.lists(), workspaceId, options] as const,
} as const;

// Type helpers for query key inference
export type LinkKeys = typeof linkKeys;
