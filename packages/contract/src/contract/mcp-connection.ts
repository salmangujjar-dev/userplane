/**
 * MCP connection management contract
 * Session-authenticated endpoints for viewing and revoking authorized MCP clients.
 */

import { oc } from '@orpc/contract';

import { ApiResponseSchema } from '../schemas';
import {
  McpConnectionByClientIdSchema,
  McpConnectionListDataSchema,
  McpConnectionListQuerySchema,
  McpConnectionRevokeDataSchema,
} from '../schemas/mcp-connection';
import { McpConnectionErrors } from '../schemas/mcp-connection.errors';

// =============================================================================
// MCP Connection Management
// =============================================================================

/**
 * GET /account/mcp-connections
 * List authorized MCP clients for the current user
 */
export const listMcpConnections = oc
  .route({
    method: 'GET',
    path: '/account/mcp-connections',
    inputStructure: 'detailed',
    summary: 'List MCP connections',
    description: 'List all authorized MCP clients for the current user.',
    tags: ['MCP Connections'],
  })
  .errors({
    UNAUTHORIZED: McpConnectionErrors.UNAUTHORIZED,
  })
  .input(McpConnectionListQuerySchema)
  .output(ApiResponseSchema(McpConnectionListDataSchema));

/**
 * DELETE /account/mcp-connections/{clientId}
 * Revoke access for a specific MCP client
 */
export const revokeMcpConnection = oc
  .route({
    method: 'DELETE',
    path: '/account/mcp-connections/{clientId}',
    inputStructure: 'detailed',
    summary: 'Revoke MCP connection',
    description: 'Revoke all tokens and consent for a specific MCP client.',
    tags: ['MCP Connections'],
  })
  .errors({
    UNAUTHORIZED: McpConnectionErrors.UNAUTHORIZED,
    MCP_CONNECTION_NOT_FOUND: McpConnectionErrors.MCP_CONNECTION_NOT_FOUND,
    MCP_CONNECTION_REVOKE_FAILED: McpConnectionErrors.MCP_CONNECTION_REVOKE_FAILED,
  })
  .input(McpConnectionByClientIdSchema)
  .output(ApiResponseSchema(McpConnectionRevokeDataSchema));
