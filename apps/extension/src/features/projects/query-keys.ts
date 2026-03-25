export const projectKeys = {
  all: ['projects'] as const,

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
} as const;
