/**
 * IntegrationRepository - Data access layer for third-party integrations
 * Handles all database operations for OAuth connections
 */

import type { IntegrationProvider, ProviderMetaFor, ProviderTokenFor } from '@workspace/contract';
import { extractAccessToken, parseProviderMeta, parseProviderToken } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import { and, eq, sql } from '@workspace/db';
import { integrations } from '@workspace/db';

import type { Transaction } from '@/api/types';

export interface CreateIntegrationInput<P extends IntegrationProvider = IntegrationProvider> {
  id: string;
  workspaceId: string;
  provider: P;
  providerWorkspaceId: string;
  providerToken: ProviderTokenFor<P>;
  providerMeta: ProviderMetaFor<P>;
}

/**
 * Typed integration result with parsed provider metadata and token
 * Generic based on provider for full type safety
 */
export interface TypedIntegration<P extends IntegrationProvider = IntegrationProvider> {
  id: string;
  workspaceId: string;
  provider: P;
  providerWorkspaceId: string;
  providerToken: ProviderTokenFor<P>;
  providerMeta: ProviderMetaFor<P>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
}

/**
 * Helper methods for TypedIntegration
 */
export class IntegrationHelper {
  /**
   * Extract access token from integration for API calls
   */
  static getAccessToken<P extends IntegrationProvider>(integration: TypedIntegration<P>): string {
    return extractAccessToken(integration.provider, integration.providerToken);
  }

  /**
   * Type guard to check if integration is for Intercom
   */
  static isIntercomIntegration(
    integration: TypedIntegration
  ): integration is TypedIntegration<'intercom'> {
    return integration.provider === 'intercom';
  }
}

export class IntegrationRepository {
  constructor(private db: DbClient) {}

  /**
   * Parse raw integration data to typed integration
   */
  private parseIntegration<P extends IntegrationProvider>(
    raw: typeof integrations.$inferSelect,
    provider: P
  ): TypedIntegration<P> {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      provider,
      providerWorkspaceId: raw.providerWorkspaceId,
      providerToken: parseProviderToken(provider, raw.providerToken),
      providerMeta: parseProviderMeta(provider, raw.providerMeta),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
    };
  }

  /**
   * Create a new integration
   */
  async create<P extends IntegrationProvider>(
    data: CreateIntegrationInput<P>,
    options?: { tx?: Transaction }
  ): Promise<TypedIntegration<P>> {
    const dbClient = options?.tx || this.db;

    const [integration] = await dbClient
      .insert(integrations)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        provider: data.provider,
        providerWorkspaceId: data.providerWorkspaceId,
        providerToken: data.providerToken,
        providerMeta: data.providerMeta,
        isDeleted: false,
      })
      .returning();

    if (!integration) {
      throw new Error('Failed to create integration');
    }

    return this.parseIntegration(integration, data.provider);
  }

  /**
   * Find integration by provider and provider workspace ID
   * Used to check for duplicate connections
   * Only returns non-deleted integrations
   */
  async findByProviderWorkspaceId<P extends IntegrationProvider>(
    provider: P,
    providerWorkspaceId: string
  ): Promise<TypedIntegration<P> | null> {
    const [integration] = await this.db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.provider, provider),
          eq(integrations.providerWorkspaceId, providerWorkspaceId),
          eq(integrations.isDeleted, false)
        )
      )
      .limit(1);

    return integration ? this.parseIntegration(integration, provider) : null;
  }

  /**
   * Find integration by workspace ID and provider
   * Only returns non-deleted integrations
   */
  async findByWorkspaceIdAndProvider<P extends IntegrationProvider>(
    workspaceId: string,
    provider: P
  ): Promise<TypedIntegration<P> | null> {
    const [integration] = await this.db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.workspaceId, workspaceId),
          eq(integrations.provider, provider),
          eq(integrations.isDeleted, false)
        )
      )
      .limit(1);

    return integration ? this.parseIntegration(integration, provider) : null;
  }

  /**
   * Delete an integration (soft delete) by workspace ID and provider
   * Sets isDeleted to true and updates deletedAt timestamp
   * If deletedAt is provided, uses that timestamp; otherwise uses current date
   */
  async delete<P extends IntegrationProvider>(
    workspaceId: string,
    provider: P,
    options?: { tx?: Transaction; deletedAt?: Date }
  ): Promise<TypedIntegration<P> | null> {
    const dbClient = options?.tx || this.db;
    const deletionTime = options?.deletedAt || new Date();

    const [deleted] = await dbClient
      .update(integrations)
      .set({
        isDeleted: true,
        deletedAt: deletionTime,
      })
      .where(
        and(
          eq(integrations.workspaceId, workspaceId),
          eq(integrations.provider, provider),
          eq(integrations.isDeleted, false)
        )
      )
      .returning();

    return deleted ? this.parseIntegration(deleted, provider) : null;
  }

  /**
   * Restore a soft-deleted integration by workspace ID and provider
   * Sets isDeleted to false and clears deletedAt timestamp
   * Restores only the record matching the specific deletedAt timestamp
   * No-op if the providerWorkspaceId is already associated with another active workspace
   * Uses a single query with subquery to check for active duplicates
   */
  async restore<P extends IntegrationProvider>(
    workspaceId: string,
    provider: P,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ): Promise<TypedIntegration<P> | null> {
    const dbClient = options?.tx || this.db;

    // Single UPDATE query with subquery to prevent duplicate providerWorkspaceId
    const [restored] = await dbClient
      .update(integrations)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        sql`workspace_id = ${workspaceId} 
        AND provider = ${provider}
        AND is_deleted = true 
        AND deleted_at = ${deletedAt}
        AND NOT EXISTS (
          SELECT 1 FROM ${integrations} AS active
          WHERE active.provider = ${integrations}.provider
          AND active.provider_workspace_id = ${integrations}.provider_workspace_id
          AND active.is_deleted = false
        )`
      )
      .returning();

    return restored ? this.parseIntegration(restored, provider) : null;
  }
}
