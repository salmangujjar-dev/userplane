/**
 * RecordingLinkRepository - Data access layer for recording links
 * Handles all database operations for recording link entities
 */

import { eq, and, count, desc, asc } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { recordingLinks, projects, workspaceMembers, user } from '@workspace/db';
import type {
  RecordingLinkFilters,
  Transaction,
  LinkProviderType,
  RecordingLinkSortOptions,
} from '@/api/types';

/**
 * Shape of recording link list item with joined data
 */
export interface RecordingLinkListRow {
  id: string;
  linkGUID: string;
  linkTitle: string | null;
  linkReusable: boolean;
  linkProviderType: LinkProviderType | null;
  linkProviderId: string | null;
  linkProviderRef: string | null;
  createdAt: Date;
  projectId: string;
  projectTitle: string | null;
  creatorId: string;
  creatorName: string;
}

/**
 * Input for creating a recording link
 */
export interface CreateRecordingLinkInput {
  id: string;
  workspaceId: string;
  projectId: string;
  domainId: string;
  createdBy: string;
  linkGUID: string;
  linkTitle: string | null;
  linkReusable: boolean;
  linkProviderType: LinkProviderType | null;
  linkProviderId: string | null;
  linkProviderRef: string | null;
}

/**
 * Input for updating a recording link
 * Note: linkGUID is immutable and cannot be updated
 */
export interface UpdateRecordingLinkInput {
  linkTitle?: string | null;
  linkReusable?: boolean;
  linkProviderType?: LinkProviderType | null;
  linkProviderId?: string | null;
  linkProviderRef?: string | null;
}

export class RecordingLinkRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new recording link
   */
  async create(data: CreateRecordingLinkInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [link] = await dbClient
      .insert(recordingLinks)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        domainId: data.domainId,
        createdBy: data.createdBy,
        linkGUID: data.linkGUID,
        linkTitle: data.linkTitle,
        linkReusable: data.linkReusable,
        linkProviderType: data.linkProviderType,
        linkProviderId: data.linkProviderId,
        linkProviderRef: data.linkProviderRef,
        isDeleted: false,
      })
      .returning();

    return link;
  }

  /**
   * Check if a linkGUID already exists
   * Used to ensure uniqueness when creating new links
   */
  async findByLinkGUID(linkGUID: string) {
    const [link] = await this.db
      .select({ id: recordingLinks.id })
      .from(recordingLinks)
      .where(eq(recordingLinks.linkGUID, linkGUID))
      .limit(1);

    return link || null;
  }

  /**
   * Build WHERE conditions for recording link queries
   * Handles workspaceId and optional filters at the SQL level
   */
  private buildWhereConditions(workspaceId: string, filters?: RecordingLinkFilters) {
    const conditions = [
      eq(recordingLinks.workspaceId, workspaceId),
      eq(recordingLinks.isDeleted, false),
    ];

    if (filters?.createdBy) {
      conditions.push(eq(recordingLinks.createdBy, filters.createdBy));
    }

    if (filters?.projectId) {
      conditions.push(eq(recordingLinks.projectId, filters.projectId));
    }

    if (filters?.domainId) {
      conditions.push(eq(recordingLinks.domainId, filters.domainId));
    }

    if (filters?.linkProviderType) {
      conditions.push(eq(recordingLinks.linkProviderType, filters.linkProviderType));
    }

    return and(...conditions);
  }

  /**
   * Build ORDER BY clause based on sort options
   * Defaults to createdAt descending (latest first)
   */
  private buildOrderBy(sort?: RecordingLinkSortOptions) {
    const direction = sort?.direction === 'asc' ? asc : desc;

    switch (sort?.field) {
      case 'link_title':
        return direction(recordingLinks.linkTitle);
      case 'created_at':
      default:
        return direction(recordingLinks.createdAt);
    }
  }

  /**
   * Find recording links by workspace ID with pagination and optional filters
   * Uses JOINs to fetch project title and creator name in a single query
   * All filtering and sorting happens at the database level
   */
  async findByWorkspaceIdPaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    filters?: RecordingLinkFilters,
    sort?: RecordingLinkSortOptions
  ): Promise<RecordingLinkListRow[]> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);
    const orderBy = this.buildOrderBy(sort);

    const results = await this.db
      .select({
        id: recordingLinks.id,
        linkGUID: recordingLinks.linkGUID,
        linkTitle: recordingLinks.linkTitle,
        linkReusable: recordingLinks.linkReusable,
        linkProviderType: recordingLinks.linkProviderType,
        linkProviderId: recordingLinks.linkProviderId,
        linkProviderRef: recordingLinks.linkProviderRef,
        createdAt: recordingLinks.createdAt,
        projectId: recordingLinks.projectId,
        projectTitle: projects.projectTitle,
        creatorId: workspaceMembers.id,
        creatorName: user.name,
      })
      .from(recordingLinks)
      .innerJoin(projects, eq(recordingLinks.projectId, projects.id))
      .innerJoin(workspaceMembers, eq(recordingLinks.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Count recording links in a workspace with optional filters
   * Uses the same filtering logic as the paginated query
   */
  async countByWorkspace(workspaceId: string, filters?: RecordingLinkFilters): Promise<number> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);

    const [result] = await this.db
      .select({ count: count() })
      .from(recordingLinks)
      .where(whereConditions);

    return Number(result?.count || 0);
  }

  /**
   * Find recording link by ID
   */
  async findById(id: string) {
    const [link] = await this.db
      .select()
      .from(recordingLinks)
      .where(and(eq(recordingLinks.id, id), eq(recordingLinks.isDeleted, false)))
      .limit(1);

    return link || null;
  }

  /**
   * Check if recording link is soft-deleted
   * Returns true if link exists but is marked as deleted
   */
  async isSoftDeleted(id: string) {
    const [link] = await this.db
      .select({
        id: recordingLinks.id,
        isDeleted: recordingLinks.isDeleted,
      })
      .from(recordingLinks)
      .where(eq(recordingLinks.id, id))
      .limit(1);

    return link ? link.isDeleted : null;
  }

  /**
   * Update recording link fields
   * Note: linkGUID is immutable and cannot be updated
   * Returns the updated recording link or null if not found
   */
  async update(id: string, data: UpdateRecordingLinkInput, options?: { tx?: Transaction }) {
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
      .update(recordingLinks)
      .set(updateData)
      .where(and(eq(recordingLinks.id, id), eq(recordingLinks.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Soft delete a recording link
   * Marks the link as deleted without removing it from the database
   */
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(recordingLinks)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(recordingLinks.id, id), eq(recordingLinks.isDeleted, false)))
      .returning();

    return deleted || null;
  }
}
