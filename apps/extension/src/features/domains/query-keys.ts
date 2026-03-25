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
