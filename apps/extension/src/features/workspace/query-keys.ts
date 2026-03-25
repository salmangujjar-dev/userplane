export const workspaceKeys = {
  all: ['workspace'] as const,

  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (workspaceId: string) => [...workspaceKeys.details(), workspaceId] as const,

  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: { page?: number; perPage?: number; includeWorkspaceMembership?: boolean }) =>
    [...workspaceKeys.lists(), filters] as const,

  members: (workspaceId: string) => [...workspaceKeys.all, 'members', workspaceId] as const,
  membersList: (workspaceId: string, pagination?: { page?: number; perPage?: number }) =>
    [...workspaceKeys.members(workspaceId), 'list', pagination] as const,

  resourceCounts: (workspaceId: string, options?: Record<string, boolean>) =>
    [...workspaceKeys.all, 'resource-counts', workspaceId, options ?? {}] as const,

  search: (workspaceId: string, params: { type: string; query: string; limit: number }) =>
    [...workspaceKeys.all, 'search', workspaceId, params] as const,
} as const;
