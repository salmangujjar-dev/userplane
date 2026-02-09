/**
 * LinkRepository - Data access layer for links
 * Handles all database operations for link entities
 */

import type { LinkProviderData } from '@workspace/contract';
import type { DbClient, Domain } from '@workspace/db';
import { and, asc, count, desc, eq, inArray, sql } from '@workspace/db';
import {
  domains,
  links,
  projects,
  recordings,
  user,
  workspaceMembers,
  workspaces,
} from '@workspace/db';

import { getUploadStatusesForGroup } from '@/api/schema/recording.schema';
import type {
  LinkFilters,
  LinkProviderType,
  LinkSortOptions,
  LinkType,
  Transaction,
} from '@/api/types';

/**
 * Shape of link list item with joined data
 */
export interface LinkListRow {
  linkId: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType;
  linkProviderId: string | null;
  linkProviderRef: string | null;
  createdAt: Date;
  workspaceId: string;
  projectId: string;
  projectTitle: string;
  creatorId: string;
  creatorName: string;
  domainId: string;
  domainUrl: string;
  domainStatus: Domain['domainStatus'];
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureClientAction: boolean;
  recordingCaptureServerLog: boolean;
  recordingCaptureNetworkLog: boolean;
}

/**
 * Input for creating a link
 */
export interface CreateLinkInput {
  linkId: string;
  workspaceId: string;
  projectId: string;
  domainId: string;
  createdBy: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType;
  linkProviderId: string | null;
  linkProviderRef: string | null;
  linkProviderData?: LinkProviderData | null;
}

/**
 * Input for updating a link
 */
export interface UpdateLinkInput {
  linkTitle?: string | null;
  linkReusable?: boolean;
  linkProviderType?: LinkProviderType;
  linkProviderId?: string | null;
  linkProviderRef?: string | null;
}

/**
 * Link with workspace preferences for session initialization
 */
export interface LinkWithWorkspacePrefsRow {
  linkId: string;
  linkType: LinkType;
  linkReusable: boolean;
  workspaceId: string;
  projectId: string;
  domainId: string;
  createdBy: string;
  createdByName: string | null;
  recordingCustomizeLink: boolean;
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureClientAction: boolean;
  recordingCaptureServerLog: boolean;
  recordingCaptureNetworkLog: boolean;
  recordingCompanyName: string | null;
  recordingCompanyLogoPath: string | null;
  recordingHeader: string | null;
  recordingFootnote: string | null;
  recordingPrimaryColor: string | null;
  recordingMaxDurationMs: number | null;
}

export class LinkRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new link
   */
  async create(data: CreateLinkInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [link] = await dbClient
      .insert(links)
      .values({
        linkId: data.linkId,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        domainId: data.domainId,
        createdBy: data.createdBy,
        linkTitle: data.linkTitle,
        linkType: data.linkType,
        linkReusable: data.linkReusable,
        linkProviderType: data.linkProviderType,
        linkProviderId: data.linkProviderId,
        linkProviderRef: data.linkProviderRef,
        linkProviderData: data.linkProviderData,
        isDeleted: false,
      })
      .returning();

    return link;
  }

  /**
   * Build WHERE conditions for link queries
   * Handles workspaceId and optional filters at the SQL level
   * Filters support multiple values using inArray for OR conditions
   */
  private buildWhereConditions(workspaceId: string, filters?: LinkFilters) {
    const conditions = [eq(links.workspaceId, workspaceId), eq(links.isDeleted, false)];

    if (filters?.createdBy && filters.createdBy.length > 0) {
      conditions.push(inArray(links.createdBy, filters.createdBy));
    }

    if (filters?.projectId && filters.projectId.length > 0) {
      conditions.push(inArray(links.projectId, filters.projectId));
    }

    if (filters?.domainId && filters.domainId.length > 0) {
      conditions.push(inArray(links.domainId, filters.domainId));
    }

    if (filters?.linkProviderType && filters.linkProviderType.length > 0) {
      const nonNullProviderTypes = filters.linkProviderType.filter(
        (type): type is NonNullable<typeof type> => type !== null
      );
      if (nonNullProviderTypes.length > 0) {
        conditions.push(inArray(links.linkProviderType, nonNullProviderTypes));
      }
    }

    if (filters?.linkType) {
      conditions.push(eq(links.linkType, filters.linkType));
    }

    return and(...conditions);
  }

  /**
   * Build ORDER BY clause based on sort options
   * Defaults to createdAt descending (latest first)
   */
  private buildOrderBy(sort?: LinkSortOptions) {
    const direction = sort?.direction === 'asc' ? asc : desc;

    switch (sort?.field) {
      case 'link_title':
        return direction(links.linkTitle);
      case 'created_at':
      default:
        return direction(links.createdAt);
    }
  }

  /**
   * Find links by workspace ID with pagination and optional filters
   * Uses JOINs to fetch project title and creator name in a single query
   * All filtering and sorting happens at the database level
   */
  async findByWorkspaceIdPaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    filters?: LinkFilters,
    sort?: LinkSortOptions
  ): Promise<LinkListRow[]> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);
    const orderBy = this.buildOrderBy(sort);

    const results = await this.db
      .select({
        linkId: links.linkId,
        linkTitle: links.linkTitle,
        linkType: links.linkType,
        linkReusable: links.linkReusable,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        createdAt: links.createdAt,
        workspaceId: links.workspaceId,
        projectId: links.projectId,
        projectTitle: projects.projectTitle,
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
        domainId: domains.domainId,
        domainUrl: domains.domainUrl,
        domainStatus: domains.domainStatus,
        recordingHideSensitive: domains.recordingHideSensitive,
        recordingCaptureClientLog: domains.recordingCaptureClientLog,
        recordingCaptureClientAction: domains.recordingCaptureClientAction,
        recordingCaptureServerLog: domains.recordingCaptureServerLog,
        recordingCaptureNetworkLog: domains.recordingCaptureNetworkLog,
      })
      .from(links)
      .innerJoin(projects, eq(links.projectId, projects.projectId))
      .innerJoin(workspaceMembers, eq(links.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Count links in a workspace with optional filters
   * Uses the same filtering logic as the paginated query
   */
  async countByWorkspace(workspaceId: string, filters?: LinkFilters): Promise<number> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);

    const [result] = await this.db.select({ count: count() }).from(links).where(whereConditions);

    return Number(result?.count || 0);
  }

  /**
   * Count active (non-deleted) links in a project
   */
  async countByProject(projectId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(links)
      .where(and(eq(links.projectId, projectId), eq(links.isDeleted, false)));

    return Number(result?.count || 0);
  }

  /**
   * Find link by ID
   */
  async findById(linkId: string) {
    const [link] = await this.db
      .select()
      .from(links)
      .where(and(eq(links.linkId, linkId), eq(links.isDeleted, false)))
      .limit(1);

    return link || null;
  }

  /**
   * Find link by ID with joined project and creator data
   * Returns complete link details for API responses
   */
  async findByIdWithDetails(linkId: string): Promise<LinkListRow | null> {
    const [result] = await this.db
      .select({
        linkId: links.linkId,
        linkTitle: links.linkTitle,
        linkType: links.linkType,
        linkReusable: links.linkReusable,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        createdAt: links.createdAt,
        workspaceId: links.workspaceId,
        projectId: links.projectId,
        projectTitle: projects.projectTitle,
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
        domainId: domains.domainId,
        domainUrl: domains.domainUrl,
        domainStatus: domains.domainStatus,
        recordingHideSensitive: domains.recordingHideSensitive,
        recordingCaptureClientLog: domains.recordingCaptureClientLog,
        recordingCaptureClientAction: domains.recordingCaptureClientAction,
        recordingCaptureServerLog: domains.recordingCaptureServerLog,
        recordingCaptureNetworkLog: domains.recordingCaptureNetworkLog,
      })
      .from(links)
      .innerJoin(projects, eq(links.projectId, projects.projectId))
      .innerJoin(workspaceMembers, eq(links.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .where(and(eq(links.linkId, linkId), eq(links.isDeleted, false)))
      .limit(1);

    return result || null;
  }

  /**
   * Check if link is soft-deleted
   * Returns true if link exists but is marked as deleted
   */
  async isSoftDeleted(linkId: string) {
    const [link] = await this.db
      .select({
        linkId: links.linkId,
        isDeleted: links.isDeleted,
      })
      .from(links)
      .where(eq(links.linkId, linkId))
      .limit(1);

    return link ? link.isDeleted : null;
  }

  /**
   * Update link fields
   * Returns the updated link or null if not found
   */
  async update(linkId: string, data: UpdateLinkInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.linkTitle !== undefined) {
      updateData.linkTitle = data.linkTitle;
    }

    if (data.linkReusable !== undefined) {
      updateData.linkReusable = data.linkReusable;
    }

    if (data.linkProviderType !== undefined) {
      updateData.linkProviderType = data.linkProviderType;
    }

    if (data.linkProviderId !== undefined) {
      updateData.linkProviderId = data.linkProviderId;
    }

    if (data.linkProviderRef !== undefined) {
      updateData.linkProviderRef = data.linkProviderRef;
    }

    const [updated] = await dbClient
      .update(links)
      .set(updateData)
      .where(and(eq(links.linkId, linkId), eq(links.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Soft delete a link
   * Marks the link as deleted without removing it from the database
   */
  async softDelete(linkId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(links)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(links.linkId, linkId), eq(links.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Find link by ID with workspace and domain preferences
   * Used for session initialization to get link context and recording settings
   * Recording toggle settings now come from the domain, not workspace
   */
  async findByIdWithWorkspacePrefs(linkId: string): Promise<LinkWithWorkspacePrefsRow | null> {
    const [result] = await this.db
      .select({
        linkId: links.linkId,
        linkType: links.linkType,
        linkReusable: links.linkReusable,
        workspaceId: links.workspaceId,
        projectId: links.projectId,
        domainId: links.domainId,
        createdBy: links.createdBy,
        createdByName: user.name,
        recordingCustomizeLink: workspaces.recordingCustomizeLink,
        recordingHideSensitive: domains.recordingHideSensitive,
        recordingCaptureClientLog: domains.recordingCaptureClientLog,
        recordingCaptureClientAction: domains.recordingCaptureClientAction,
        recordingCaptureServerLog: domains.recordingCaptureServerLog,
        recordingCaptureNetworkLog: domains.recordingCaptureNetworkLog,
        recordingCompanyName: workspaces.recordingCompanyName,
        recordingCompanyLogoPath: workspaces.recordingCompanyLogoPath,
        recordingHeader: workspaces.recordingHeader,
        recordingFootnote: workspaces.recordingFootnote,
        recordingPrimaryColor: workspaces.recordingPrimaryColor,
        recordingMaxDurationMs: workspaces.recordingMaxDurationMs,
      })
      .from(links)
      .innerJoin(workspaces, eq(links.workspaceId, workspaces.workspaceId))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .innerJoin(workspaceMembers, eq(links.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(links.linkId, linkId),
          eq(links.isDeleted, false),
          eq(workspaces.isDeleted, false),
          eq(domains.isDeleted, false)
        )
      )
      .limit(1);

    return result || null;
  }

  /**
   * Count all recordings for a link regardless of status
   * Includes both deleted and non-deleted recordings
   * Used to check single-use link restrictions
   */
  async countRecordingsForLink(linkId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .where(eq(recordings.recordingLinkId, linkId));

    return Number(result?.count || 0);
  }

  /**
   * Count recordings in terminal states for a link
   * Terminal states: available, expired, purged
   * Includes both deleted and non-deleted recordings to prevent link reuse
   * Used to check single-use link restrictions for session creation
   * Non-terminal state (pending) allows retry with new session tokens
   */
  async countTerminalRecordingsForLink(linkId: string): Promise<number> {
    const terminalStatuses = [...getUploadStatusesForGroup('TERMINAL')];

    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .where(
        and(
          eq(recordings.recordingLinkId, linkId),
          inArray(recordings.uploadStatus, terminalStatuses)
        )
      );

    return Number(result?.count || 0);
  }

  /**
   * Search links by title using PostgreSQL Full-Text Search
   * Uses to_tsvector and to_tsquery with prefix matching and ranking
   * Multi-word searches use & operator, results ordered by ts_rank
   */
  async searchByTitle(workspaceId: string, searchTerms: string[], limit: number) {
    // Build tsquery string with prefix matching for each term
    // Join multiple terms with & (AND operator)
    const tsquery = searchTerms.map((term) => `${term}:*`).join(' & ');

    // Use raw SQL for FTS with ranking
    // to_tsvector('simple', ...) creates searchable document from linkTitle
    // to_tsquery('simple', ...) creates search query with prefix matching
    // ts_rank calculates relevance score
    const searchResults = await this.db
      .select({
        linkId: links.linkId,
        linkTitle: links.linkTitle,
        linkType: links.linkType,
        linkReusable: links.linkReusable,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        createdAt: links.createdAt,
        workspaceId: links.workspaceId,
        projectId: projects.projectId,
        projectTitle: projects.projectTitle,
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
        domainId: domains.domainId,
        domainUrl: domains.domainUrl,
        domainStatus: domains.domainStatus,
        recordingHideSensitive: domains.recordingHideSensitive,
        recordingCaptureClientLog: domains.recordingCaptureClientLog,
        recordingCaptureClientAction: domains.recordingCaptureClientAction,
        recordingCaptureServerLog: domains.recordingCaptureServerLog,
        recordingCaptureNetworkLog: domains.recordingCaptureNetworkLog,
        rank: sql<number>`ts_rank(to_tsvector('simple', COALESCE(${links.linkTitle}, '')), to_tsquery('simple', ${tsquery}))`,
      })
      .from(links)
      .innerJoin(projects, eq(links.projectId, projects.projectId))
      .innerJoin(workspaceMembers, eq(links.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .where(
        and(
          eq(links.workspaceId, workspaceId),
          eq(links.isDeleted, false),
          sql`to_tsvector('simple', COALESCE(${links.linkTitle}, '')) @@ to_tsquery('simple', ${tsquery})`
        )
      )
      .orderBy(
        sql`ts_rank(to_tsvector('simple', COALESCE(${links.linkTitle}, '')), to_tsquery('simple', ${tsquery})) DESC`
      )
      .limit(limit);

    return searchResults;
  }

  /**
   * Soft delete all links in workspace
   * Used for workspace deletion cascade
   */
  async softDeleteByWorkspaceId(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const deleted = await dbClient
      .update(links)
      .set({
        isDeleted: true,
        deletedAt: deletedAt,
      })
      .where(and(eq(links.workspaceId, workspaceId), eq(links.isDeleted, false)))
      .returning();

    return deleted;
  }

  /**
   * Restore links in workspace that were deleted at a specific timestamp
   * Used for workspace restoration to restore associated links
   * Only restores links deleted at the exact same time as the workspace
   */
  async restoreByWorkspaceIdAndDeletionTime(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const restored = await dbClient
      .update(links)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        and(
          eq(links.workspaceId, workspaceId),
          eq(links.isDeleted, true),
          eq(links.deletedAt, deletedAt)
        )
      )
      .returning();

    return restored;
  }

  /**
   * Count links in workspace that were deleted at a specific timestamp
   * Used for workspace restore info to show how many links will be restored
   */
  async countByWorkspaceIdAndDeletionTime(workspaceId: string, deletedAt: Date) {
    const [result] = await this.db
      .select({ count: count() })
      .from(links)
      .where(
        and(
          eq(links.workspaceId, workspaceId),
          eq(links.isDeleted, true),
          eq(links.deletedAt, deletedAt)
        )
      );

    return result?.count ?? 0;
  }

  /**
   * Soft delete all links in project
   * Used for project deletion cascade
   */
  async softDeleteByProjectId(projectId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const deleted = await dbClient
      .update(links)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(links.projectId, projectId), eq(links.isDeleted, false)))
      .returning();

    return deleted;
  }

  /**
   * Get link IDs by domain ID
   * Used for cache invalidation when domain preferences change
   */
  async getLinkIdsByDomainId(domainId: string): Promise<string[]> {
    const results = await this.db
      .select({ linkId: links.linkId })
      .from(links)
      .where(and(eq(links.domainId, domainId), eq(links.isDeleted, false)));

    return results.map((r) => r.linkId);
  }

  /**
   * Get link IDs by workspace ID
   * Used for cache invalidation when workspace preferences change
   */
  async getLinkIdsByWorkspaceId(workspaceId: string): Promise<string[]> {
    const results = await this.db
      .select({ linkId: links.linkId })
      .from(links)
      .where(and(eq(links.workspaceId, workspaceId), eq(links.isDeleted, false)));

    return results.map((r) => r.linkId);
  }

  /**
   * Get link IDs by project ID
   * Used for cache invalidation when project is deleted
   */
  async getLinkIdsByProjectId(projectId: string): Promise<string[]> {
    const results = await this.db
      .select({ linkId: links.linkId })
      .from(links)
      .where(and(eq(links.projectId, projectId), eq(links.isDeleted, false)));

    return results.map((r) => r.linkId);
  }
}
