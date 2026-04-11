/**
 * MCP Connection Service
 * Business logic for listing and revoking authorized MCP client connections.
 */

import type { McpConnectionData } from '@userplane/contract';

import type { McpConnectionRepository } from '@/api/repositories/mcp-connections.repository';

export class McpConnectionService {
  constructor(private repo: McpConnectionRepository) {}

  /**
   * List authorized MCP connections for a user with pagination.
   */
  async listConnections(userId: string, page: number, perPage: number) {
    const total = await this.repo.countByUserId(userId);
    const offset = (page - 1) * perPage;
    const rows = await this.repo.findConnectionsByUserId(userId, perPage, offset);

    const connections: McpConnectionData[] = rows.map((row) => ({
      clientId: row.clientId,
      name: row.name,
      icon: row.icon,
      uri: row.uri,
      softwareVersion: row.softwareVersion,
      scopes: row.scopes,
      authorizedAt: row.authorizedAt?.toISOString() ?? '',
      tokenStatus: row.tokenStatus,
      lastTokenIssuedAt: row.lastTokenIssuedAt,
    }));

    return { connections, total };
  }

  /**
   * Revoke an MCP connection (tokens + consent) for a specific client.
   * Returns true if the connection was found and revoked.
   */
  async revokeConnection(userId: string, clientId: string): Promise<boolean> {
    return this.repo.revokeByClientAndUser(clientId, userId);
  }
}
