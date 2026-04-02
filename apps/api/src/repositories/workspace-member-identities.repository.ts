/**
 * WorkspaceMemberIdentityRepository - Data access layer for member identities
 * Handles all database operations for provider-specific external identity mappings.
 * Follows the same typed pattern as IntegrationRepository.
 */

import type { MemberIdentityMetaFor, MemberIdentityProvider } from '@userplane/contract';
import { parseMemberIdentityMeta } from '@userplane/contract';
import type { DbClient } from '@userplane/db';
import { and, eq } from '@userplane/db';
import { workspaceMemberIdentities } from '@userplane/db';

import type { Transaction } from '@/api/types';

export interface CreateMemberIdentityInput<
  P extends MemberIdentityProvider = MemberIdentityProvider,
> {
  id: string;
  workspaceMemberId: string;
  workspaceId: string;
  provider: P;
  providerMeta: MemberIdentityMetaFor<P>;
}

/**
 * Typed identity result with parsed provider metadata
 * Generic based on provider for full type safety
 */
export interface TypedMemberIdentity<P extends MemberIdentityProvider = MemberIdentityProvider> {
  id: string;
  workspaceMemberId: string;
  workspaceId: string;
  provider: P;
  providerMeta: MemberIdentityMetaFor<P>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
}

export class WorkspaceMemberIdentityRepository {
  constructor(private db: DbClient) {}

  /**
   * Parse raw identity data to typed identity
   */
  private parseMemberIdentity<P extends MemberIdentityProvider>(
    raw: typeof workspaceMemberIdentities.$inferSelect,
    provider: P
  ): TypedMemberIdentity<P> {
    if (raw.provider !== provider) {
      throw new Error(
        `Member identity provider mismatch: expected ${provider}, got ${raw.provider}`
      );
    }

    return {
      id: raw.id,
      workspaceMemberId: raw.workspaceMemberId,
      workspaceId: raw.workspaceId,
      provider,
      providerMeta: parseMemberIdentityMeta(provider, raw.providerMeta),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
    };
  }

  /**
   * Create a new member identity
   */
  async create<P extends MemberIdentityProvider>(
    data: CreateMemberIdentityInput<P>,
    options?: { tx?: Transaction }
  ): Promise<TypedMemberIdentity<P>> {
    const dbClient = options?.tx || this.db;

    const [identity] = await dbClient
      .insert(workspaceMemberIdentities)
      .values({
        id: data.id,
        workspaceMemberId: data.workspaceMemberId,
        workspaceId: data.workspaceId,
        provider: data.provider,
        providerMeta: data.providerMeta,
        isDeleted: false,
      })
      .returning();

    if (!identity) {
      throw new Error('Failed to create member identity');
    }

    return this.parseMemberIdentity(identity, data.provider);
  }

  /**
   * Find active identity by workspace member ID and provider
   */
  async findByMemberAndProvider<P extends MemberIdentityProvider>(
    workspaceMemberId: string,
    provider: P
  ): Promise<TypedMemberIdentity<P> | null> {
    const [identity] = await this.db
      .select()
      .from(workspaceMemberIdentities)
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceMemberId, workspaceMemberId),
          eq(workspaceMemberIdentities.provider, provider),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      )
      .limit(1);

    return identity ? this.parseMemberIdentity(identity, provider) : null;
  }

  /**
   * Find all active identities for a workspace member
   */
  async findByMemberId(workspaceMemberId: string): Promise<TypedMemberIdentity[]> {
    const results = await this.db
      .select()
      .from(workspaceMemberIdentities)
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceMemberId, workspaceMemberId),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      );

    return results.map((r) => this.parseMemberIdentity(r, r.provider as MemberIdentityProvider));
  }

  /**
   * Soft delete identity by workspace member ID and provider
   */
  async softDelete<P extends MemberIdentityProvider>(
    workspaceMemberId: string,
    provider: P,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ): Promise<TypedMemberIdentity<P> | null> {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(workspaceMemberIdentities)
      .set({
        isDeleted: true,
        deletedAt,
      })
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceMemberId, workspaceMemberId),
          eq(workspaceMemberIdentities.provider, provider),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      )
      .returning();

    return deleted ? this.parseMemberIdentity(deleted, provider) : null;
  }

  /**
   * Soft delete all identities for a workspace member
   * Used when a member is removed or leaves the workspace
   */
  async softDeleteByMemberId(
    workspaceMemberId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(workspaceMemberIdentities)
      .set({
        isDeleted: true,
        deletedAt,
      })
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceMemberId, workspaceMemberId),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      )
      .returning();
  }

  /**
   * Soft delete all identities for a workspace
   * Used when a workspace is deleted (cascade soft delete)
   */
  async softDeleteByWorkspaceId(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(workspaceMemberIdentities)
      .set({
        isDeleted: true,
        deletedAt,
      })
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceId, workspaceId),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      )
      .returning();
  }

  /**
   * Soft delete all identities for a workspace + provider combination
   * Used when an integration is disconnected (e.g., Slack disconnected)
   */
  async softDeleteByWorkspaceAndProvider<P extends MemberIdentityProvider>(
    workspaceId: string,
    provider: P,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(workspaceMemberIdentities)
      .set({
        isDeleted: true,
        deletedAt,
      })
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceId, workspaceId),
          eq(workspaceMemberIdentities.provider, provider),
          eq(workspaceMemberIdentities.isDeleted, false)
        )
      )
      .returning();
  }

  /**
   * Restore all identities for a workspace that were deleted at a specific timestamp
   * Used during workspace restoration (cascade restore)
   * Only restores identities deleted at the exact same time as the workspace
   */
  async restoreByWorkspaceIdAndDeletionTime(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(workspaceMemberIdentities)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        and(
          eq(workspaceMemberIdentities.workspaceId, workspaceId),
          eq(workspaceMemberIdentities.isDeleted, true),
          eq(workspaceMemberIdentities.deletedAt, deletedAt)
        )
      )
      .returning();
  }

  /**
   * Update provider metadata for an existing identity
   * Used to refresh identity data (e.g., re-resolve Slack user ID)
   */
  async updateProviderMeta<P extends MemberIdentityProvider>(
    id: string,
    providerMeta: MemberIdentityMetaFor<P>,
    options?: { tx?: Transaction }
  ): Promise<void> {
    const dbClient = options?.tx || this.db;

    await dbClient
      .update(workspaceMemberIdentities)
      .set({ providerMeta })
      .where(
        and(eq(workspaceMemberIdentities.id, id), eq(workspaceMemberIdentities.isDeleted, false))
      );
  }
}
