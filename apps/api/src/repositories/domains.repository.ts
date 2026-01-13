/**
 * DomainRepository - Data access layer for domains
 * Handles all database operations for domain entities
 */

import { eq, and, ne, count, ilike, asc, desc } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { domains } from '@workspace/db';
import type { Transaction, CreateDomainInput } from '@/api/types';

export type DomainSortField = 'created_at' | 'domain_url';
export type SortDirection = 'asc' | 'desc';

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
        domainId: data.domainId,
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
  async findById(domainId: string) {
    const [domain] = await this.db
      .select()
      .from(domains)
      .where(and(eq(domains.domainId, domainId), eq(domains.isDeleted, false)))
      .limit(1);

    return domain || null;
  }

  /**
   * Check if domain is soft-deleted
   * Returns true if domain exists but is marked as deleted
   */
  async isSoftDeleted(domainId: string) {
    const [domain] = await this.db
      .select({
        domainId: domains.domainId,
        isDeleted: domains.isDeleted,
      })
      .from(domains)
      .where(eq(domains.domainId, domainId))
      .limit(1);

    return domain ? domain.isDeleted : null;
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
   * Find domains by workspace ID with pagination and sorting
   */
  async findByWorkspaceIdPaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    sortBy: DomainSortField = 'created_at',
    sortDirection: SortDirection = 'desc'
  ) {
    const sortColumn = sortBy === 'domain_url' ? domains.domainUrl : domains.createdAt;
    const orderFn = sortDirection === 'asc' ? asc : desc;

    return this.db
      .select()
      .from(domains)
      .where(and(eq(domains.workspaceId, workspaceId), eq(domains.isDeleted, false)))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count domains in a workspace
   */
  async countByWorkspace(workspaceId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(domains)
      .where(and(eq(domains.workspaceId, workspaceId), eq(domains.isDeleted, false)));

    return Number(result?.count || 0);
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
   * Find domain by workspace ID and URL, excluding a specific domain ID
   * Used to check uniqueness when updating a domain
   */
  async findByWorkspaceAndUrlExcluding(workspaceId: string, url: string, excludeDomainId: string) {
    const [domain] = await this.db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.workspaceId, workspaceId),
          eq(domains.domainUrl, url),
          ne(domains.domainId, excludeDomainId),
          eq(domains.isDeleted, false)
        )
      )
      .limit(1);

    return domain || null;
  }

  /**
   * Update domain URL
   * Updates the domain URL and resets status to pending
   */
  async updateUrl(domainId: string, url: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(domains)
      .set({
        domainUrl: url,
        domainStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(and(eq(domains.domainId, domainId), eq(domains.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Soft delete a domain
   * Sets isDeleted to true and updates deletedAt timestamp
   */
  async softDelete(domainId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(domains)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(domains.domainId, domainId), eq(domains.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Search domains by URL
   * Uses case-insensitive ILIKE pattern matching on domain URL
   */
  async searchByUrl(workspaceId: string, searchTerms: string[], limit: number) {
    const conditions = [eq(domains.workspaceId, workspaceId), eq(domains.isDeleted, false)];

    // Add ILIKE conditions for each search term
    // Each term must match somewhere in the URL (AND logic)
    for (const term of searchTerms) {
      conditions.push(ilike(domains.domainUrl, `%${term}%`));
    }

    return this.db
      .select()
      .from(domains)
      .where(and(...conditions))
      .limit(limit);
  }

  /**
   * Mark domain as verified
   * Updates domain status to verified
   */
  async markAsVerified(workspaceId: string, url: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(domains)
      .set({
        domainStatus: 'verified',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(domains.workspaceId, workspaceId),
          eq(domains.domainUrl, url),
          eq(domains.isDeleted, false)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Update domain recording preferences
   * Updates recording toggle settings for the domain
   */
  async updateRecordingPreferences(
    domainId: string,
    data: Partial<{
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureClientAction: boolean;
      recordingCaptureServerLog: boolean;
      recordingCaptureNetworkLog: boolean;
    }>,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.recordingHideSensitive !== undefined) {
      updateData.recordingHideSensitive = data.recordingHideSensitive;
    }

    if (data.recordingCaptureClientLog !== undefined) {
      updateData.recordingCaptureClientLog = data.recordingCaptureClientLog;
    }

    if (data.recordingCaptureClientAction !== undefined) {
      updateData.recordingCaptureClientAction = data.recordingCaptureClientAction;
    }

    if (data.recordingCaptureServerLog !== undefined) {
      updateData.recordingCaptureServerLog = data.recordingCaptureServerLog;
    }

    if (data.recordingCaptureNetworkLog !== undefined) {
      updateData.recordingCaptureNetworkLog = data.recordingCaptureNetworkLog;
    }

    const [updated] = await dbClient
      .update(domains)
      .set(updateData)
      .where(and(eq(domains.domainId, domainId), eq(domains.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Find domain preferences by ID
   * Returns recording toggle settings for the domain
   */
  async findPreferencesById(domainId: string) {
    const [preferences] = await this.db
      .select({
        recordingHideSensitive: domains.recordingHideSensitive,
        recordingCaptureClientLog: domains.recordingCaptureClientLog,
        recordingCaptureClientAction: domains.recordingCaptureClientAction,
        recordingCaptureServerLog: domains.recordingCaptureServerLog,
        recordingCaptureNetworkLog: domains.recordingCaptureNetworkLog,
      })
      .from(domains)
      .where(and(eq(domains.domainId, domainId), eq(domains.isDeleted, false)))
      .limit(1);

    return preferences || null;
  }
}
