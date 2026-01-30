/**
 * Query key factory for workspace-related queries
 *
 * Structure:
 * - all: Base key for all workspace queries
 * - details(): All detail queries
 * - detail(id): Specific workspace detail
 * - lists(): All list queries
 * - list(filters): Specific list configuration
 *
 * Why these decisions were made:
 * - Hierarchical structure enables partial invalidations
 * - Type safety with 'as const' prevents runtime errors
 * - Each level builds on previous for flexibility
 */
export const workspaceKeys = {
  // Top-level: invalidate EVERYTHING workspace-related
  all: ['workspace'] as const,

  // Details: single workspace data
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (workspaceId: string) => [...workspaceKeys.details(), workspaceId] as const,

  // Lists: multiple workspaces
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: { page?: number; perPage?: number; includeWorkspaceMembership?: boolean }) =>
    [...workspaceKeys.lists(), filters] as const,

  // Members
  members: (workspaceId: string) => [...workspaceKeys.all, 'members', workspaceId] as const,
  membersList: (workspaceId: string, pagination?: { page?: number; perPage?: number }) =>
    [...workspaceKeys.members(workspaceId), 'list', pagination] as const,

  // Notifications
  notifications: (workspaceId: string) =>
    [...workspaceKeys.all, 'notifications', workspaceId] as const,

  // Preferences
  preferences: (workspaceId: string) => [...workspaceKeys.all, 'preferences', workspaceId] as const,

  // Status
  status: (workspaceId: string) => [...workspaceKeys.all, 'status', workspaceId] as const,

  // Resource counts
  resourceCounts: (
    workspaceId: string,
    options?: {
      includeProjects?: boolean;
      includeRecordings?: boolean;
      includeActiveRecordings?: boolean;
      includeLinks?: boolean;
      includeDomains?: boolean;
      includeMembers?: boolean;
    }
  ) => [...workspaceKeys.all, 'resource-counts', workspaceId, options] as const,

  // Invite
  invite: (workspaceId: string) => [...workspaceKeys.all, 'invite', workspaceId] as const,
  invitePolicy: (workspaceId: string) =>
    [...workspaceKeys.all, 'invite-policy', workspaceId] as const,
  validateInvite: (token: string) => [...workspaceKeys.all, 'validate-invite', token] as const,

  // Billing
  billingEmail: (workspaceId: string) =>
    [...workspaceKeys.all, 'billing-email', workspaceId] as const,

  // Search & Suggestions
  suggestions: (pagination?: { page?: number; perPage?: number }) =>
    [...workspaceKeys.all, 'suggestions', pagination] as const,
  search: (workspaceId: string, options: { type: string; query: string; limit?: number }) =>
    [...workspaceKeys.all, 'search', workspaceId, options] as const,
  count: () => [...workspaceKeys.all, 'count'] as const,

  // Role - current user's membership/role in workspace
  role: (workspaceId: string) => [...workspaceKeys.all, 'role', workspaceId] as const,

  // Access requests
  accessRequests: () => [...workspaceKeys.all, 'access-request'] as const,
  accessRequestValidate: (token: string) =>
    [...workspaceKeys.accessRequests(), 'validate', token] as const,

  // Restore info
  restoreInfo: (workspaceId: string) =>
    [...workspaceKeys.all, 'restore-info', workspaceId] as const,
} as const;

// Type helpers for query key inference
export type WorkspaceKeys = typeof workspaceKeys;
