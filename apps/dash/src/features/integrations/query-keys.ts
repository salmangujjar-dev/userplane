/**
 * Query key factory for integration-related queries
 */
export const integrationKeys = {
  all: ['integrations'] as const,

  // Intercom
  intercom: (workspaceId: string) => [...integrationKeys.all, 'intercom', workspaceId] as const,
  intercomAdmins: (workspaceId: string, excludeMembers: boolean) =>
    [...integrationKeys.all, 'intercom', 'admins', workspaceId, { excludeMembers }] as const,
} as const;

// Type helpers for query key inference
export type IntegrationKeys = typeof integrationKeys;
