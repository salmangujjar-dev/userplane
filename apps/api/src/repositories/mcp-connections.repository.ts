/**
 * MCP Connection Repository - Data access layer for OAuth-based MCP connections
 * Queries oauth_consent, oauth_client, oauth_access_token, and oauth_refresh_token
 * to derive authorized MCP client data for a given user.
 */

import type { DbClient } from '@userplane/db';
import { and, count, desc, eq, inArray, sql } from '@userplane/db';
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from '@userplane/db';

export class McpConnectionRepository {
  constructor(private db: DbClient) {}

  /**
   * Count total authorized MCP clients for a user.
   */
  async countByUserId(userId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(oauthConsent)
      .where(eq(oauthConsent.userId, userId));

    return Number(result?.count ?? 0);
  }

  /**
   * Find authorized MCP clients for a user with pagination.
   * Joins oauth_consent with oauth_client and aggregates token status.
   */
  async findConnectionsByUserId(userId: string, limit: number, offset: number) {
    const now = new Date();

    const connections = await this.db
      .select({
        clientId: oauthClient.clientId,
        name: oauthClient.name,
        icon: oauthClient.icon,
        uri: oauthClient.uri,
        softwareVersion: oauthClient.softwareVersion,
        scopes: oauthConsent.scopes,
        authorizedAt: oauthConsent.createdAt,
      })
      .from(oauthConsent)
      .innerJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
      .where(eq(oauthConsent.userId, userId))
      .orderBy(desc(oauthConsent.createdAt))
      .limit(limit)
      .offset(offset);

    if (connections.length === 0) return [];

    const clientIds = connections.map((c) => c.clientId);

    // Aggregate token status per client in a single query
    const tokenStatus = await this.db
      .select({
        clientId: oauthAccessToken.clientId,
        hasActiveAccess: sql<boolean>`bool_or(${oauthAccessToken.expiresAt} > ${now})`.as(
          'has_active_access'
        ),
        lastTokenIssuedAt: sql<string | null>`max(${oauthAccessToken.createdAt})::text`.as(
          'last_token_issued_at'
        ),
      })
      .from(oauthAccessToken)
      .where(
        and(eq(oauthAccessToken.userId, userId), inArray(oauthAccessToken.clientId, clientIds))
      )
      .groupBy(oauthAccessToken.clientId);

    // Check refresh tokens separately (different revoked logic)
    const refreshStatus = await this.db
      .select({
        clientId: oauthRefreshToken.clientId,
        hasActiveRefresh:
          sql<boolean>`bool_or(${oauthRefreshToken.expiresAt} > ${now} AND ${oauthRefreshToken.revoked} IS NULL)`.as(
            'has_active_refresh'
          ),
      })
      .from(oauthRefreshToken)
      .where(
        and(eq(oauthRefreshToken.userId, userId), inArray(oauthRefreshToken.clientId, clientIds))
      )
      .groupBy(oauthRefreshToken.clientId);

    const tokenMap = new Map(tokenStatus.map((t) => [t.clientId, t]));
    const refreshMap = new Map(refreshStatus.map((r) => [r.clientId, r]));

    return connections.map((conn) => {
      const tokens = tokenMap.get(conn.clientId);
      const refresh = refreshMap.get(conn.clientId);

      const isActive = tokens?.hasActiveAccess || refresh?.hasActiveRefresh || false;

      return {
        clientId: conn.clientId,
        name: conn.name,
        icon: conn.icon,
        uri: conn.uri,
        softwareVersion: conn.softwareVersion,
        scopes: conn.scopes,
        authorizedAt: conn.authorizedAt,
        tokenStatus: isActive ? ('active' as const) : ('inactive' as const),
        lastTokenIssuedAt: tokens?.lastTokenIssuedAt ?? null,
      };
    });
  }

  /**
   * Revoke all tokens and consent for a specific client+user pair.
   * Runs in a transaction: delete access tokens, mark refresh tokens as revoked, delete consent.
   */
  async revokeByClientAndUser(clientId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      // Delete access tokens
      await tx
        .delete(oauthAccessToken)
        .where(and(eq(oauthAccessToken.clientId, clientId), eq(oauthAccessToken.userId, userId)));

      // Mark refresh tokens as revoked
      await tx
        .update(oauthRefreshToken)
        .set({ revoked: new Date() })
        .where(
          and(
            eq(oauthRefreshToken.clientId, clientId),
            eq(oauthRefreshToken.userId, userId),
            sql`${oauthRefreshToken.revoked} IS NULL`
          )
        );

      // Delete consent
      const deleted = await tx
        .delete(oauthConsent)
        .where(and(eq(oauthConsent.clientId, clientId), eq(oauthConsent.userId, userId)))
        .returning();

      return deleted.length > 0;
    });
  }
}
