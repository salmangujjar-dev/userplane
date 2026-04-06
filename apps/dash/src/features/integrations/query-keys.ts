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
  zendeskAgents: (workspaceId: string, excludeMembers: boolean) =>
    [...integrationKeys.zendesk(workspaceId), 'agents', { excludeMembers }] as const,
  zendeskSuggestions: (workspaceId: string, limit?: number) =>
    [...integrationKeys.zendesk(workspaceId), 'suggestions', { limit }] as const,

  // Slack
  slack: (workspaceId: string) => [...integrationKeys.all, 'slack', workspaceId] as const,
  slackMembers: (workspaceId: string, excludeMembers: boolean) =>
    [...integrationKeys.slack(workspaceId), 'members', { excludeMembers }] as const,
  slackSuggestions: (workspaceId: string, limit?: number) =>
    [...integrationKeys.slack(workspaceId), 'suggestions', { limit }] as const,
} as const;

// Type helpers for query key inference
export type IntegrationKeys = typeof integrationKeys;
