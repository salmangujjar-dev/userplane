/**
 * Query key factory for domain-related queries
 *
 * Structure:
 * - all: Base key for all domain queries
 * - lists(): All list queries
 * - list(workspaceId, options): Specific list configuration
 *
 * Why this structure:
 * - Simple hierarchy for domain listing
 * - Groups pagination and sort options into objects
 * - Enables invalidating all domain lists vs specific configurations
 */
export const domainKeys = {
  all: ['domains'] as const,

  lists: () => [...domainKeys.all, 'list'] as const,
  list: (
    workspaceId: string,
    options?: {
      page?: number;
      perPage?: number;
      sort?: {
        by?: 'created_at' | 'domain_url';
        direction?: 'asc' | 'desc';
      };
    }
  ) => [...domainKeys.lists(), workspaceId, options] as const,
} as const;

// Type helpers for query key inference
export type DomainKeys = typeof domainKeys;
