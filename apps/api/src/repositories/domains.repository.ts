/**
 * DomainRepository - Data access layer for domains
 * Handles all database operations for domain entities
 */

import { eq, and } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { domains } from '@workspace/db';
import type { Transaction, CreateDomainInput } from '@/api/types';

export class DomainRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new domain
   */
  async create(data: CreateDomainInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [domain] = await dbClient
      .insert(domains)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        domainUrl: data.url,
        domainStatus: data.domainStatus,
        isDeleted: false,
      })
      .returning();

    return domain;
  }

  /**
   * Find domain by ID
   */
  async findById(id: string) {
    const [domain] = await this.db
      .select()
      .from(domains)
      .where(and(eq(domains.id, id), eq(domains.isDeleted, false)))
      .limit(1);

    return domain || null;
  }

  /**
   * Find domains by workspace ID
   */
  async findByWorkspaceId(workspaceId: string) {
    return this.db
      .select()
      .from(domains)
      .where(and(eq(domains.workspaceId, workspaceId), eq(domains.isDeleted, false)));
  }

  /**
   * Find domain by workspace ID and URL
   * Used to check if a domain already exists for a workspace
   */
  async findByWorkspaceAndUrl(workspaceId: string, url: string) {
    const [domain] = await this.db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.workspaceId, workspaceId),
          eq(domains.domainUrl, url),
          eq(domains.isDeleted, false)
        )
      )
      .limit(1);

    return domain || null;
  }

  /**
   * Soft delete a domain
   * Sets isDeleted to true and updates deletedAt timestamp
   */
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(domains)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(domains.id, id), eq(domains.isDeleted, false)))
      .returning();

    return deleted || null;
  }
}
