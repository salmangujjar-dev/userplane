/**
 * Query key factory for integration-related queries
 */
export const integrationKeys = {
  all: ['integrations'] as const,

  // Intercom
  intercom: (workspaceId: string) => [...integrationKeys.all, 'intercom', workspaceId] as const,
  intercomAdmins: (workspaceId: string, excludeMembers: boolean) =>
    [...integrationKeys.intercom(workspaceId), 'admins', { excludeMembers }] as const,
  intercomSuggestions: (workspaceId: string, limit?: number) =>
    [...integrationKeys.intercom(workspaceId), 'suggestions', { limit }] as const,

  // Zendesk
  zendesk: (workspaceId: string) => [...integrationKeys.all, 'zendesk', workspaceId] as const,

  // Slack
  slack: (workspaceId: string) => [...integrationKeys.all, 'slack', workspaceId] as const,
} as const;

// Type helpers for query key inference
export type IntegrationKeys = typeof integrationKeys;
