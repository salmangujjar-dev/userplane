/**
 * MCP connection management contract implementation using oRPC
 * Session-authenticated endpoints for viewing and revoking authorized MCP clients.
 */

import { MCP_CONNECTION_PAGINATION, mcpConnectionError } from '@userplane/contract';

import { authorized } from '@/api/middleware/auth.orpc';
import type { McpConnectionService } from '@/api/services/mcp-connection.service';
import { createPaginationMeta } from '@/api/types';

// =============================================================================
// MCP Connection Procedure Factory
// =============================================================================

export const createMcpConnectionProcedures = (mcpConnectionService: McpConnectionService) => {
  return {
    list: listMcpConnectionsImpl(mcpConnectionService),
    revoke: revokeMcpConnectionImpl(mcpConnectionService),
  };
};

// =============================================================================
// Implementations
// =============================================================================

/**
 * GET /account/mcp-connections — List authorized MCP clients
 */
const listMcpConnectionsImpl = (mcpConnectionService: McpConnectionService) =>
  authorized.mcpConnection.list.handler(async ({ input, context }) => {
    const page = input.query.page || 1;
    const perPage = input.query.per_page || MCP_CONNECTION_PAGINATION.DEFAULT_PER_PAGE;

    const { connections, total } = await mcpConnectionService.listConnections(
      context.user.id,
      page,
      perPage
    );

    return {
      message: 'MCP connections retrieved successfully',
      data: {
        connections,
        pagination: createPaginationMeta(page, perPage, total),
      },
    };
  });

/**
 * DELETE /account/mcp-connections/{clientId} — Revoke a specific MCP client
 */
const revokeMcpConnectionImpl = (mcpConnectionService: McpConnectionService) =>
  authorized.mcpConnection.revoke.handler(async ({ input, context }) => {
    const revoked = await mcpConnectionService.revokeConnection(
      context.user.id,
      input.params.clientId
    );

    if (!revoked) {
      throw mcpConnectionError.MCP_CONNECTION_NOT_FOUND();
    }

    return {
      message: 'MCP connection revoked successfully',
      data: { revoked: true as const },
    };
  });
