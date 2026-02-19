/**
 * Query key factory for admin-related queries
 */
export const adminKeys = {
  all: ['admin'] as const,

  // Users
  users: () => [...adminKeys.all, 'users'] as const,
  userSearch: (params: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: string;
    filterStatus?: string;
  }) => [...adminKeys.users(), 'search', params] as const,
  userDetail: (userId: string) => [...adminKeys.users(), 'detail', userId] as const,
  userSessions: (userId: string, pagination?: { limit?: number; offset?: number }) =>
    [...adminKeys.users(), 'sessions', userId, pagination] as const,
  userWorkspaces: (userId: string, pagination?: { limit?: number; offset?: number }) =>
    [...adminKeys.users(), 'workspaces', userId, pagination] as const,

  // Workspaces
  workspaces: () => [...adminKeys.all, 'workspaces'] as const,
  workspaceSearch: (params: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: string;
    filterStatus?: string;
  }) => [...adminKeys.workspaces(), 'search', params] as const,
  workspaceDetail: (workspaceId: string) =>
    [...adminKeys.workspaces(), 'detail', workspaceId] as const,
  workspaceMembers: (workspaceId: string, pagination?: { limit?: number; offset?: number }) =>
    [...adminKeys.workspaces(), 'members', workspaceId, pagination] as const,
  workspaceProjects: (
    workspaceId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDirection?: string;
      filterStatus?: string;
    }
  ) => [...adminKeys.workspaces(), 'projects', workspaceId, params] as const,

  // Entitlements
  workspaceEntitlements: (workspaceId: string) =>
    [...adminKeys.workspaces(), 'entitlements', workspaceId] as const,

  // Recordings
  recordings: () => [...adminKeys.all, 'recordings'] as const,
  recordingDetail: (recordingId: string) =>
    [...adminKeys.recordings(), 'detail', recordingId] as const,

  // Plans
  plans: () => [...adminKeys.all, 'plans'] as const,
  plansList: (params?: { pageNumber?: number; pageSize?: number }) =>
    [...adminKeys.plans(), 'list', params ?? {}] as const,
  planDetail: (productId: string) => [...adminKeys.plans(), 'detail', productId] as const,
} as const;

// Type helpers for query key inference
export type AdminKeys = typeof adminKeys;
