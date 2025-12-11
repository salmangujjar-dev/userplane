/**
 * LinkRepository - Data access layer for links
 * Handles all database operations for link entities
 */

import { eq, and, count, desc, asc } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { links, projects, workspaceMembers, user } from '@workspace/db';
import type {
  LinkFilters,
  Transaction,
  LinkProviderType,
  LinkType,
  LinkSortOptions,
} from '@/api/types';

/**
 * Shape of link list item with joined data
 */
export interface LinkListRow {
  id: string;
  linkTitle: string | null;
  linkType: LinkType;
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
 * Input for creating a link
 */
export interface CreateLinkInput {
  id: string;
  workspaceId: string;
  projectId: string;
  domainId: string;
  createdBy: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType | null;
  linkProviderId: string | null;
  linkProviderRef: string | null;
}

/**
 * Input for updating a link
 */
export interface UpdateLinkInput {
  linkTitle?: string | null;
  linkReusable?: boolean;
  linkProviderType?: LinkProviderType | null;
  linkProviderId?: string | null;
  linkProviderRef?: string | null;
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
        id: data.id,
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
        isDeleted: false,
      })
      .returning();

    return link;
  }

  /**
   * Build WHERE conditions for link queries
   * Handles workspaceId and optional filters at the SQL level
   */
  private buildWhereConditions(workspaceId: string, filters?: LinkFilters) {
    const conditions = [eq(links.workspaceId, workspaceId), eq(links.isDeleted, false)];

    if (filters?.createdBy) {
      conditions.push(eq(links.createdBy, filters.createdBy));
    }

    if (filters?.projectId) {
      conditions.push(eq(links.projectId, filters.projectId));
    }

    if (filters?.domainId) {
      conditions.push(eq(links.domainId, filters.domainId));
    }

    if (filters?.linkProviderType) {
      conditions.push(eq(links.linkProviderType, filters.linkProviderType));
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
        id: links.id,
        linkTitle: links.linkTitle,
        linkType: links.linkType,
        linkReusable: links.linkReusable,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        createdAt: links.createdAt,
        projectId: links.projectId,
        projectTitle: projects.projectTitle,
        creatorId: workspaceMembers.id,
        creatorName: user.name,
      })
      .from(links)
      .innerJoin(projects, eq(links.projectId, projects.id))
      .innerJoin(workspaceMembers, eq(links.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
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
   * Find link by ID
   */
  async findById(id: string) {
    const [link] = await this.db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.isDeleted, false)))
      .limit(1);

    return link || null;
  }

  /**
   * Check if link is soft-deleted
   * Returns true if link exists but is marked as deleted
   */
  async isSoftDeleted(id: string) {
    const [link] = await this.db
      .select({
        id: links.id,
        isDeleted: links.isDeleted,
      })
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    return link ? link.isDeleted : null;
  }

  /**
   * Update link fields
   * Returns the updated link or null if not found
   */
  async update(id: string, data: UpdateLinkInput, options?: { tx?: Transaction }) {
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
      .where(and(eq(links.id, id), eq(links.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Soft delete a link
   * Marks the link as deleted without removing it from the database
   */
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(links)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(links.id, id), eq(links.isDeleted, false)))
      .returning();

    return deleted || null;
  }
}
