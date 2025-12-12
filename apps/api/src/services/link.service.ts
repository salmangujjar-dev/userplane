/**
 * LinkService - Business logic for link operations
 * Contains validation and business rules for link management
 */

import { generateLinkId } from '@/api/lib/id-generator';
import { LinkRepository } from '@/api/repositories/links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { parseLinkReference } from '@/api/lib/link-reference-parser';
import type {
  LinkFilters,
  LinkItem,
  LinkSortOptions,
  Transaction,
  LinkProviderType,
} from '@/api/types';

export interface LinkServiceDeps {
  linkRepo: LinkRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  projectRepo: ProjectRepository;
}

/**
 * Maximum items per page for pagination
 */
const MAX_PER_PAGE = 20;

/**
 * Default items per page
 */
const DEFAULT_PER_PAGE = 10;

/**
 * Parameters for creating a link
 */
export interface CreateLinkParams {
  workspaceId: string;
  projectId?: string;
  domainId: string;
  createdBy: string;
  linkReference?: string;
  linkReusable?: boolean;
}

/**
 * Parameters for updating a link
 */
export interface UpdateLinkParams {
  linkTitle?: string | null;
  linkReusable?: boolean;
  linkProviderType?: LinkProviderType | null;
  linkProviderId?: string | null;
  linkProviderRef?: string | null;
}

export class LinkService {
  constructor(private deps: LinkServiceDeps) {}

  /**
   * Extract first name from full name
   * Handles various name formats
   */
  private extractFirstName(fullName: string): string {
    const trimmed = fullName.trim();
    const firstWord = trimmed.split(/\s+/)[0];
    return firstWord || trimmed;
  }

  /**
   * Create a new link
   * Parses the linkReference to infer provider info and generate title
   * If linkReference is empty, uses user's first name as default
   * If projectId is not provided, uses the default project for the workspace
   */
  async create(params: CreateLinkParams, options?: { tx?: Transaction }) {
    // Get the workspace member with user info
    const memberWithUser = await this.deps.workspaceMemberRepo.findByIdWithUser(params.createdBy);
    if (!memberWithUser) {
      throw new ValidationError('Workspace member not found');
    }

    // Verify member belongs to the workspace
    if (memberWithUser.workspaceId !== params.workspaceId) {
      throw new ValidationError('Workspace member does not belong to this workspace');
    }

    // Determine projectId - use provided or get default
    let projectId = params.projectId;
    if (!projectId) {
      const defaultProject = await this.deps.projectRepo.findDefaultByWorkspace(params.workspaceId);
      if (!defaultProject) {
        throw new ValidationError('No default project found for workspace');
      }
      projectId = defaultProject.id;
    }

    // Determine linkReference - use provided or generate default based on user's first name
    let linkReference = params.linkReference;
    if (!linkReference || linkReference.trim() === '') {
      const firstName = this.extractFirstName(memberWithUser.userName);
      linkReference = `${firstName}'s Recording Link`;
    }

    // Parse link reference to extract provider info
    const parsed = parseLinkReference(linkReference);

    // Generate unique ID for the link (12-character alphanumeric)
    const id = generateLinkId();

    // Create the link
    // Currently only 'recording' type is supported
    const link = await this.deps.linkRepo.create(
      {
        id,
        workspaceId: params.workspaceId,
        projectId,
        domainId: params.domainId,
        createdBy: params.createdBy,
        linkTitle: parsed.linkTitle,
        linkType: 'recording',
        linkReusable: params.linkReusable ?? false,
        linkProviderType: parsed.linkProviderType,
        linkProviderId: parsed.linkProviderId,
        linkProviderRef: parsed.linkProviderRef,
      },
      options
    );

    return link;
  }

  /**
   * Get links for a workspace with pagination, filters, and sorting
   * All filtering and sorting is performed at the database level
   * Default sort: created_at descending (latest first)
   */
  async getByWorkspaceIdPaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = DEFAULT_PER_PAGE,
    filters?: LinkFilters,
    sort?: LinkSortOptions
  ): Promise<{ links: LinkItem[]; total: number }> {
    // Validate pagination params
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > MAX_PER_PAGE) {
      throw new ValidationError(`Per page must be between 1 and ${MAX_PER_PAGE}`);
    }

    // Get total count with filters applied at DB level
    const total = await this.deps.linkRepo.countByWorkspace(workspaceId, filters);

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Get paginated results with all data joined at DB level
    // Default sort: created_at desc (latest first)
    const rows = await this.deps.linkRepo.findByWorkspaceIdPaginated(
      workspaceId,
      perPage,
      offset,
      filters,
      sort ?? { field: 'created_at', direction: 'desc' }
    );

    // Map database rows to response shape with flattened linkProvider fields
    const links: LinkItem[] = rows.map((row) => ({
      id: row.id,
      linkTitle: row.linkTitle,
      linkType: row.linkType,
      linkReusable: row.linkReusable,
      linkProviderType: row.linkProviderType,
      linkProviderId: row.linkProviderId,
      linkProviderReference: row.linkProviderRef,
      createdAt: row.createdAt,
      project: {
        id: row.projectId,
        title: row.projectTitle,
      },
      creator: {
        id: row.creatorId,
        name: row.creatorName,
      },
    }));

    return {
      links,
      total,
    };
  }

  /**
   * Update a link
   * Validates ownership before updating
   */
  async update(
    linkId: string,
    workspaceId: string,
    params: UpdateLinkParams,
    options?: { tx?: Transaction }
  ) {
    // Get existing link
    const existingLink = await this.deps.linkRepo.findById(linkId);

    if (!existingLink) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(linkId);
      if (isSoftDeleted === true) {
        throw new GoneError('Link has been deleted');
      }
      throw new NotFoundError('Link not found');
    }

    // Verify link belongs to the workspace
    if (existingLink.workspaceId !== workspaceId) {
      throw new ValidationError('Link does not belong to this workspace');
    }

    // Perform update
    const updated = await this.deps.linkRepo.update(linkId, params, options);

    if (!updated) {
      throw new ValidationError('Failed to update link');
    }

    return updated;
  }

  /**
   * Delete a link
   * Validates ownership before soft deleting
   * Performs soft delete by marking isDeleted as true
   */
  async delete(linkId: string, workspaceId: string, options?: { tx?: Transaction }) {
    // Get existing link
    const existingLink = await this.deps.linkRepo.findById(linkId);

    if (!existingLink) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(linkId);
      if (isSoftDeleted === true) {
        throw new GoneError('Link has already been deleted');
      }
      throw new NotFoundError('Link not found');
    }

    // Verify link belongs to the workspace
    if (existingLink.workspaceId !== workspaceId) {
      throw new ValidationError('Link does not belong to this workspace');
    }

    // Perform soft delete
    const deleted = await this.deps.linkRepo.softDelete(linkId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete link');
    }

    return deleted;
  }
}
