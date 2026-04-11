/**
 * MCP connection error definitions
 * Used by the MCP connection management endpoints (dashboard-facing)
 */

export const McpConnectionErrors = {
  // Authentication
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to manage MCP connections.',
  },

  // Not found
  MCP_CONNECTION_NOT_FOUND: {
    status: 404,
    message: 'No authorized connection found for this client.',
  },

  // Infrastructure
  MCP_CONNECTION_REVOKE_FAILED: {
    status: 500,
    message: 'Failed to revoke MCP connection.',
  },
} as const;
