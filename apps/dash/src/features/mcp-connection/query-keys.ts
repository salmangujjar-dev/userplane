/**
 * Query key factory for MCP connection queries
 *
 * Structure:
 * - all: Base key for all MCP connection queries
 * - lists: Base key for list queries
 * - list: Parameterized by pagination
 */
export const mcpConnectionKeys = {
  all: ['mcp-connection'] as const,
  lists: () => [...mcpConnectionKeys.all, 'list'] as const,
  list: (pagination?: { page?: number; perPage?: number }) =>
    [...mcpConnectionKeys.lists(), pagination] as const,
} as const;

export type McpConnectionKeys = typeof mcpConnectionKeys;
