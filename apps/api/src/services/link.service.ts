/**
 * LinkService - Business logic for link operations
 * Contains validation and business rules for link management
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/api/env';
import { generateLinkId } from '@/api/lib/id';
import { LinkRepository } from '@/api/repositories/links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { parseLinkReference } from '@/api/lib/parser';
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
  domainRepo: DomainRepository;
  workspaceRepo: WorkspaceRepository;
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
  linkProviderType?: LinkProviderType;
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
   * Generate a JWT-encoded link URL for accessing recordings
   * Token expires in 180 days
   * Payload contains lid (link ID) for link identification
   * Uses custom domain if verified AND recording features are enabled, otherwise falls back to recorder URL
   * Recording features: hide sensitive fields, capture client logs, capture server logs, capture network logs
   */
  generateLinkURL(
    linkId: string,
    domainUrl?: string,
    domainStatus?: string,
    recordingHideSensitive?: boolean,
    recordingCaptureClientLog?: boolean,
    recordingCaptureServerLog?: boolean,
    recordingCaptureNetworkLog?: boolean
  ): string {
    const payload = {
      lid: linkId,
    };

    const options: SignOptions = {
      expiresIn: env.recorder.expiresIn,
    };
    const token = jwt.sign(payload, env.recorder.secret, options);

    // Use custom domain only if:
    // 1. Domain is verified
    // 2. Domain URL exists
    // 3. At least one recording feature is enabled
    const needsCustomDomain =
      recordingHideSensitive ||
      recordingCaptureClientLog ||
      recordingCaptureServerLog ||
      recordingCaptureNetworkLog;
    const baseUrl =
      domainStatus === 'verified' && domainUrl && needsCustomDomain
        ? `https://${domainUrl}`
        : env.recorder.url;

    return `${baseUrl}/r?token=${token}`;
  }

  /**
   * Verify and decode a link token
   * Returns the link ID if valid, throws error if invalid or expired
   */
  verifyLinkToken(token: string): string {
    try {
      const decoded = jwt.verify(token, env.recorder.secret) as { lid: string };
      if (!decoded.lid) {
        throw new ValidationError('Invalid link token: missing link ID');
      }
      return decoded.lid;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ValidationError('Link token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('Invalid link token');
      }
      throw error;
    }
  }

  /**
   * Create a new link
   * Parses the linkReference to infer provider info and generate title
   * If linkReference is empty, uses user's first name as default
   * If projectId is not provided, uses the default project for the workspace
   */
  async create(params: CreateLinkParams, options?: { tx?: Transaction }) {
    // Guard rail: Check if workspace is deleted
    const isWorkspaceDeleted = await this.deps.workspaceRepo.isSoftDeleted(params.workspaceId);
    if (isWorkspaceDeleted === null) {
      throw new NotFoundError('Workspace not found');
    }
    if (isWorkspaceDeleted) {
      throw new ValidationError('Workspace has been deleted');
    }

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
      projectId = defaultProject.projectId;
    }

    // Guard rail: Check if project is deleted
    const isProjectDeleted = await this.deps.projectRepo.isSoftDeleted(projectId);
    if (isProjectDeleted === null) {
      throw new NotFoundError('Project not found');
    }
    if (isProjectDeleted) {
      throw new ValidationError('Project has been deleted');
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
        linkId: id,
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

    if (!link) {
      throw new ValidationError('Failed to create link');
    }

    // Fetch domain info for linkURL generation
    const domain = await this.deps.domainRepo.findById(params.domainId);

    // Return link with domain info - construct explicit object to ensure proper types
    return {
      linkId: link.linkId,
      workspaceId: link.workspaceId,
      projectId: link.projectId,
      domainId: link.domainId,
      createdBy: link.createdBy,
      linkTitle: link.linkTitle,
      linkType: link.linkType,
      linkReusable: link.linkReusable,
      linkProviderType: link.linkProviderType,
      linkProviderId: link.linkProviderId,
      linkProviderRef: link.linkProviderRef,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      isDeleted: link.isDeleted,
      deletedAt: link.deletedAt,
      domainUrl: domain?.domainUrl || '',
      domainStatus: domain?.domainStatus || ('pending' as const),
      recordingHideSensitive: domain?.recordingHideSensitive || false,
      recordingCaptureClientLog: domain?.recordingCaptureClientLog || false,
      recordingCaptureServerLog: domain?.recordingCaptureServerLog || false,
      recordingCaptureNetworkLog: domain?.recordingCaptureNetworkLog || false,
    };
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

    // Map database rows to response shape with flattened linkProvider fields and linkURL
    const links: LinkItem[] = rows.map((row) => ({
      linkId: row.linkId,
      linkTitle: row.linkTitle,
      linkType: row.linkType,
      linkReusable: row.linkReusable,
      linkProviderType: row.linkProviderType,
      linkProviderId: row.linkProviderId,
      linkProviderReference: row.linkProviderRef,
      linkURL: this.generateLinkURL(
        row.linkId,
        row.domainUrl,
        row.domainStatus,
        row.recordingHideSensitive,
        row.recordingCaptureClientLog,
        row.recordingCaptureServerLog,
        row.recordingCaptureNetworkLog
      ),
      createdAt: row.createdAt,
      project: {
        projectId: row.projectId,
        title: row.projectTitle,
      },
      creator: {
        workspaceMemberId: row.creatorId,
        name: row.creatorName,
      },
      domain: {
        domainId: row.domainId,
        url: row.domainUrl,
        status: row.domainStatus,
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

    // Fetch domain info for linkURL generation
    const domain = await this.deps.domainRepo.findById(updated.domainId);

    // Return updated link with domain info - construct explicit object to ensure proper types
    return {
      linkId: updated.linkId,
      workspaceId: updated.workspaceId,
      projectId: updated.projectId,
      domainId: updated.domainId,
      createdBy: updated.createdBy,
      linkTitle: updated.linkTitle,
      linkType: updated.linkType,
      linkReusable: updated.linkReusable,
      linkProviderType: updated.linkProviderType,
      linkProviderId: updated.linkProviderId,
      linkProviderRef: updated.linkProviderRef,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      isDeleted: updated.isDeleted,
      deletedAt: updated.deletedAt,
      domainUrl: domain?.domainUrl || '',
      domainStatus: domain?.domainStatus || ('pending' as const),
      recordingHideSensitive: domain?.recordingHideSensitive || false,
      recordingCaptureClientLog: domain?.recordingCaptureClientLog || false,
      recordingCaptureServerLog: domain?.recordingCaptureServerLog || false,
      recordingCaptureNetworkLog: domain?.recordingCaptureNetworkLog || false,
    };
  }

  /**
   * Get a link by ID with full details
   * Validates ownership before returning
   */
  async getById(linkId: string, workspaceId: string): Promise<LinkItem> {
    // Get link with joined project and creator data
    const linkWithDetails = await this.deps.linkRepo.findByIdWithDetails(linkId);

    if (!linkWithDetails) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(linkId);
      if (isSoftDeleted === true) {
        throw new GoneError('Link has been deleted');
      }
      throw new NotFoundError('Link not found');
    }

    // Verify link belongs to the workspace
    if (linkWithDetails.workspaceId !== workspaceId) {
      throw new ValidationError('Link does not belong to this workspace');
    }

    // Map to LinkItem response shape with linkURL
    return {
      linkId: linkWithDetails.linkId,
      linkTitle: linkWithDetails.linkTitle,
      linkType: linkWithDetails.linkType,
      linkReusable: linkWithDetails.linkReusable,
      linkProviderType: linkWithDetails.linkProviderType,
      linkProviderId: linkWithDetails.linkProviderId,
      linkProviderReference: linkWithDetails.linkProviderRef,
      linkURL: this.generateLinkURL(
        linkWithDetails.linkId,
        linkWithDetails.domainUrl,
        linkWithDetails.domainStatus,
        linkWithDetails.recordingHideSensitive,
        linkWithDetails.recordingCaptureClientLog,
        linkWithDetails.recordingCaptureServerLog,
        linkWithDetails.recordingCaptureNetworkLog
      ),
      createdAt: linkWithDetails.createdAt,
      project: {
        projectId: linkWithDetails.projectId,
        title: linkWithDetails.projectTitle,
      },
      creator: {
        workspaceMemberId: linkWithDetails.creatorId,
        name: linkWithDetails.creatorName,
      },
      domain: {
        domainId: linkWithDetails.domainId,
        url: linkWithDetails.domainUrl,
        status: linkWithDetails.domainStatus,
      },
    };
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
