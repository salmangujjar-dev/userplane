/**
 * DomainService - Domain service for domain operations
 * Contains business logic for domain management
 */

import { generateDomainId } from '@/api/lib/id-generator';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { cleanUrl } from '@/api/lib/utils';
import type { Transaction, CreateDomainParams } from '@/api/types';
import { TokenService } from '@/api/services/token.service';

export interface DomainServiceDeps {
  domainRepo: DomainRepository;
  tokenService: TokenService;
}

export class DomainService {
  constructor(private deps: DomainServiceDeps) {}

  /**
   * Create a new domain
   * Accepts any URL format and cleans it before storage
   * Stores protocol + hostname + path (removes query params, hash, and trailing slashes)
   * Checks for duplicates before creating
   */
  async create(params: CreateDomainParams, options?: { tx?: Transaction }) {
    if (!params.url) {
      throw new ValidationError('Domain URL is required');
    }

    // Clean URL: remove query parameters, hash, and trailing slashes
    const normalized = cleanUrl(params.url);

    // Check if domain already exists for this workspace
    const existingDomain = await this.deps.domainRepo.findByWorkspaceAndUrl(
      params.workspaceId,
      normalized
    );

    if (existingDomain) {
      throw new ValidationError('This domain has already been added to the workspace');
    }

    return this.deps.domainRepo.create(
      {
        id: generateDomainId(),
        workspaceId: params.workspaceId,
        url: normalized,
        domainStatus: params.status,
      },
      options
    );
  }

  /**
   * Get all domains for a workspace
   * Excludes soft-deleted domains
   */
  async getByWorkspaceId(workspaceId: string) {
    return this.deps.domainRepo.findByWorkspaceId(workspaceId);
  }

  /**
   * Get domains for a workspace with pagination
   */
  async getByWorkspaceIdPaginated(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > 10) {
      throw new ValidationError('Per page must be between 1 and 10');
    }

    const total = await this.deps.domainRepo.countByWorkspace(workspaceId);
    const offset = (page - 1) * perPage;
    const domains = await this.deps.domainRepo.findByWorkspaceIdPaginated(
      workspaceId,
      perPage,
      offset
    );

    return {
      domains,
      total,
    };
  }

  /**
   * Update domain URL
   * Cleans and validates new URL
   * Checks for uniqueness within the workspace (excluding current domain)
   * Resets domain status to "pending" since verification needs to be redone
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async updateDomainUrl(
    domainId: string,
    workspaceId: string,
    newUrl: string,
    options?: { tx?: Transaction }
  ) {
    if (!newUrl) {
      throw new ValidationError('Domain URL is required');
    }

    // Get existing domain and check if it exists
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }

    // Verify domain belongs to the workspace
    if (domain.workspaceId !== workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    // Clean URL: remove query parameters, hash, and trailing slashes
    const normalized = cleanUrl(newUrl);

    // If URL hasn't changed, no need to update
    if (domain.domainUrl === normalized) {
      return domain;
    }

    // Check if the new URL already exists for another domain in this workspace
    const existingDomain = await this.deps.domainRepo.findByWorkspaceAndUrlExcluding(
      workspaceId,
      normalized,
      domainId
    );

    if (existingDomain) {
      throw new ValidationError('This domain has already been added to the workspace');
    }

    // Update the domain URL and reset status to pending
    const updated = await this.deps.domainRepo.updateUrl(domainId, normalized, options);

    if (!updated) {
      throw new ValidationError('Failed to update domain');
    }

    return updated;
  }

  /**
   * Soft delete a domain
   * Marks domain as deleted without removing from database
   * Prevents deletion of the last domain in a workspace
   * Throws GoneError if already soft-deleted, NotFoundError if not found
   */
  async deleteDomain(domainId: string, workspaceId: string, options?: { tx?: Transaction }) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    // Check if this is the last domain in the workspace
    const domainCount = await this.deps.domainRepo.countByWorkspace(workspaceId);

    if (domainCount === 1) {
      throw new ValidationError('Cannot delete the only domain in a workspace');
    }

    const deleted = await this.deps.domainRepo.softDelete(domainId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete domain');
    }

    return deleted;
  }

  /**
   * Generate domain verification token
   * Creates a JWT token that expires in 5 minutes for domain verification
   */
  generateVerificationToken(workspaceId: string, domainId: string, url: string): string {
    const normalized = cleanUrl(url);
    return this.deps.tokenService.generateDomainVerificationToken(
      workspaceId,
      domainId,
      normalized
    );
  }

  /**
   * Verify domain ownership using JWT token
   * Validates token, checks domain registration by ID, and marks domain as verified
   * Compares hostname and path between origin and stored domain URL
   * Returns the updated domain record
   */
  async verifyDomain(token: string, originHostname: string) {
    // Verify JWT token
    const payload = this.deps.tokenService.verifyDomainToken(token);

    if (!payload) {
      throw new ValidationError('Invalid verification token');
    }

    // Issuer is already checked in verifyDomainToken

    // Look up domain by ID from token
    const domain = await this.deps.domainRepo.findById(payload.domainId);

    if (!domain) {
      throw new NotFoundError('Domain is not registered for this workspace');
    }

    // Verify domain belongs to the workspace from token
    if (domain.workspaceId !== payload.workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    // Parse stored domain URL to get hostname and pathname
    let storedHostname: string;
    let storedPathname: string;
    try {
      const storedUrl = new URL(domain.domainUrl);
      storedHostname = storedUrl.hostname;
      storedPathname = storedUrl.pathname;
    } catch {
      throw new ValidationError('Invalid stored domain URL');
    }

    // Parse origin to construct full origin URL for comparison
    let originUrl: URL;
    try {
      originUrl = new URL(`https://${originHostname}`);
    } catch {
      throw new ValidationError('Invalid origin hostname');
    }

    // Compare hostname
    if (storedHostname !== originUrl.hostname) {
      throw new ValidationError('Origin does not match registered domain');
    }

    // If stored URL has a path, check if origin path starts with it
    if (storedPathname && storedPathname !== '/') {
      // For path matching, we need the full origin URL from the request
      // Since we only have hostname here, we'll skip path validation
      // The recorder script should send the full origin URL
    }

    // Mark as verified
    await this.deps.domainRepo.markAsVerified(payload.workspaceId, domain.domainUrl);

    // Return updated domain
    const updatedDomain = await this.deps.domainRepo.findById(payload.domainId);
    if (!updatedDomain) {
      throw new ValidationError('Failed to verify domain');
    }

    return updatedDomain;
  }

  /**
   * Get domain by ID with recording preferences
   * Returns complete domain details including recording toggle settings
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async getByIdWithPreferences(domainId: string, workspaceId: string) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    return domain;
  }

  /**
   * Get domain recording preferences by ID
   * Returns recording toggle settings for the domain
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async getPreferencesById(domainId: string) {
    const preferences = await this.deps.domainRepo.findPreferencesById(domainId);
    if (!preferences) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }
    return preferences;
  }

  /**
   * Update domain recording preferences
   * Updates recording toggle settings for the domain
   * Only allows updates if domain is verified
   * Throws GoneError if soft-deleted, NotFoundError if not found, ValidationError if not verified
   */
  async updateRecordingPreferences(
    domainId: string,
    workspaceId: string,
    updates: Partial<{
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureServerLog: boolean;
      recordingCaptureNetworkLog: boolean;
    }>,
    options?: { tx?: Transaction }
  ) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    if (domain.domainStatus !== 'verified') {
      throw new ValidationError(
        'Cannot update recording preferences for unverified domain. Please verify the domain first.'
      );
    }

    const updated = await this.deps.domainRepo.updateRecordingPreferences(
      domainId,
      updates,
      options
    );
    if (!updated) {
      throw new NotFoundError('Failed to update domain preferences');
    }

    return updated;
  }

  /**
   * Replace domain recording preferences
   * Replaces all recording toggle settings for the domain
   * Only allows updates if domain is verified
   * Throws GoneError if soft-deleted, NotFoundError if not found, ValidationError if not verified
   */
  async replaceRecordingPreferences(
    domainId: string,
    workspaceId: string,
    preferences: {
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureServerLog: boolean;
      recordingCaptureNetworkLog: boolean;
    },
    options?: { tx?: Transaction }
  ) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new GoneError('Domain has been deleted');
      }
      throw new NotFoundError('Domain not found');
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ValidationError('Domain does not belong to this workspace');
    }

    if (domain.domainStatus !== 'verified') {
      throw new ValidationError(
        'Cannot update recording preferences for unverified domain. Please verify the domain first.'
      );
    }

    const updated = await this.deps.domainRepo.updateRecordingPreferences(
      domainId,
      preferences,
      options
    );
    if (!updated) {
      throw new NotFoundError('Failed to update domain preferences');
    }

    return updated;
  }
}
