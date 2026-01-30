/**
 * Query key factory for integration-related queries
 */
export const integrationKeys = {
  all: ['integrations'] as const,

  // Intercom
  intercom: (workspaceId: string) => [...integrationKeys.all, 'intercom', workspaceId] as const,
} as const;

// Type helpers for query key inference
export type IntegrationKeys = typeof integrationKeys;
