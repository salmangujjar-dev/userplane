/**
 * RecordingLinkService - Business logic for recording link operations
 * Contains validation and business rules for recording link management
 */

import { nanoid } from 'nanoid';
import { RecordingLinkRepository } from '@/api/repositories/recording-links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { parseLinkReference } from '@/api/lib/link-reference-parser';
import type {
  RecordingLinkFilters,
  RecordingLinkItem,
  RecordingLinkSortOptions,
  Transaction,
  LinkProviderType,
} from '@/api/types';

export interface RecordingLinkServiceDeps {
  recordingLinkRepo: RecordingLinkRepository;
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
 * Length of linkGUID (6-character alphanumeric)
 */
const LINK_GUID_LENGTH = 6;

/**
 * Max retries for generating unique linkGUID
 */
const MAX_GUID_RETRIES = 5;

/**
 * Parameters for creating a recording link
 */
export interface CreateRecordingLinkParams {
  workspaceId: string;
  projectId?: string;
  domainId: string;
  createdBy: string;
  linkReference?: string;
  linkReusable?: boolean;
}

/**
 * Parameters for updating a recording link
 * Note: linkGUID is immutable and cannot be updated
 */
export interface UpdateRecordingLinkParams {
  linkTitle?: string | null;
  linkReusable?: boolean;
  linkProviderType?: LinkProviderType | null;
  linkProviderId?: string | null;
  linkProviderRef?: string | null;
}

export class RecordingLinkService {
  constructor(private deps: RecordingLinkServiceDeps) {}

  /**
   * Generate a unique 6-character alphanumeric linkGUID
   * Retries if collision detected
   */
  private async generateUniqueLinkGUID(): Promise<string> {
    for (let i = 0; i < MAX_GUID_RETRIES; i++) {
      const guid = nanoid(LINK_GUID_LENGTH);
      const existing = await this.deps.recordingLinkRepo.findByLinkGUID(guid);
      if (!existing) {
        return guid;
      }
    }
    throw new ValidationError('Failed to generate unique link GUID after multiple attempts');
  }

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
   * Create a new recording link
   * Parses the linkReference to infer provider info and generate title
   * If linkReference is empty, uses user's first name as default
   * If projectId is not provided, uses the default project for the workspace
   */
  async create(params: CreateRecordingLinkParams, options?: { tx?: Transaction }) {
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

    // Generate unique linkGUID
    const linkGUID = await this.generateUniqueLinkGUID();

    // Generate unique ID for the recording link
    const id = `rl_${nanoid(16)}`;

    // Create the recording link
    const link = await this.deps.recordingLinkRepo.create(
      {
        id,
        workspaceId: params.workspaceId,
        projectId,
        domainId: params.domainId,
        createdBy: params.createdBy,
        linkGUID,
        linkTitle: parsed.linkTitle,
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
   * Get recording links for a workspace with pagination, filters, and sorting
   * All filtering and sorting is performed at the database level
   * Default sort: created_at descending (latest first)
   */
  async getByWorkspaceIdPaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = DEFAULT_PER_PAGE,
    filters?: RecordingLinkFilters,
    sort?: RecordingLinkSortOptions
  ): Promise<{ recordingLinks: RecordingLinkItem[]; total: number }> {
    // Validate pagination params
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > MAX_PER_PAGE) {
      throw new ValidationError(`Per page must be between 1 and ${MAX_PER_PAGE}`);
    }

    // Get total count with filters applied at DB level
    const total = await this.deps.recordingLinkRepo.countByWorkspace(workspaceId, filters);

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Get paginated results with all data joined at DB level
    // Default sort: created_at desc (latest first)
    const rows = await this.deps.recordingLinkRepo.findByWorkspaceIdPaginated(
      workspaceId,
      perPage,
      offset,
      filters,
      sort ?? { field: 'created_at', direction: 'desc' }
    );

    // Map database rows to response shape with nested linkProvider
    const recordingLinks: RecordingLinkItem[] = rows.map((row) => ({
      id: row.id,
      linkGUID: row.linkGUID,
      linkTitle: row.linkTitle,
      linkReusable: row.linkReusable,
      linkProvider: {
        type: row.linkProviderType,
        id: row.linkProviderId,
        reference: row.linkProviderRef,
      },
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
      recordingLinks,
      total,
    };
  }

  /**
   * Update a recording link
   * Validates ownership before updating
   * Note: linkGUID is immutable and cannot be updated
   */
  async update(
    recordingLinkId: string,
    workspaceId: string,
    params: UpdateRecordingLinkParams,
    options?: { tx?: Transaction }
  ) {
    // Get existing recording link
    const existingLink = await this.deps.recordingLinkRepo.findById(recordingLinkId);

    if (!existingLink) {
      const isSoftDeleted = await this.deps.recordingLinkRepo.isSoftDeleted(recordingLinkId);
      if (isSoftDeleted === true) {
        throw new GoneError('Recording link has been deleted');
      }
      throw new NotFoundError('Recording link not found');
    }

    // Verify link belongs to the workspace
    if (existingLink.workspaceId !== workspaceId) {
      throw new ValidationError('Recording link does not belong to this workspace');
    }

    // Perform update
    const updated = await this.deps.recordingLinkRepo.update(recordingLinkId, params, options);

    if (!updated) {
      throw new ValidationError('Failed to update recording link');
    }

    return updated;
  }

  /**
   * Delete a recording link
   * Validates ownership before soft deleting
   * Performs soft delete by marking isDeleted as true
   */
  async delete(recordingLinkId: string, workspaceId: string, options?: { tx?: Transaction }) {
    // Get existing recording link
    const existingLink = await this.deps.recordingLinkRepo.findById(recordingLinkId);

    if (!existingLink) {
      const isSoftDeleted = await this.deps.recordingLinkRepo.isSoftDeleted(recordingLinkId);
      if (isSoftDeleted === true) {
        throw new GoneError('Recording link has already been deleted');
      }
      throw new NotFoundError('Recording link not found');
    }

    // Verify link belongs to the workspace
    if (existingLink.workspaceId !== workspaceId) {
      throw new ValidationError('Recording link does not belong to this workspace');
    }

    // Perform soft delete
    const deleted = await this.deps.recordingLinkRepo.softDelete(recordingLinkId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete recording link');
    }

    return deleted;
  }
}
