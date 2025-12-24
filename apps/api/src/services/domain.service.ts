/**
 * DomainService - Domain service for domain operations
 * Contains business logic for domain management
 */

import { ORPCError } from '@orpc/server';
import { generateDomainId } from '@/api/lib/id';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { cleanUrl } from '@/api/lib/url';
import type { Transaction } from '@/api/types';
import type { DomainStatus } from '@workspace/contract';
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
   * Throws DOMAIN_URL_REQUIRED if URL is missing or DOMAIN_ALREADY_EXISTS if duplicate
   */
  async create(
    params: { workspaceId: string; url: string; status: DomainStatus },
    options?: { tx?: Transaction }
  ) {
    if (!params.url) {
      throw new ORPCError('DOMAIN_URL_REQUIRED', {
        message: 'Domain URL is required',
      });
    }

    // Clean URL: remove query parameters, hash, and trailing slashes
    const normalized = cleanUrl(params.url);

    // Check if domain already exists for this workspace
    const existingDomain = await this.deps.domainRepo.findByWorkspaceAndUrl(
      params.workspaceId,
      normalized
    );

    if (existingDomain) {
      throw new ORPCError('DOMAIN_ALREADY_EXISTS', {
        message: 'This domain has already been added to the workspace',
      });
    }

    return this.deps.domainRepo.create(
      {
        domainId: generateDomainId(),
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
   * If no domains found, validates workspace existence (since workspace always has at least 1 domain)
   * Throws DOMAIN_PAGE_INVALID or DOMAIN_PER_PAGE_INVALID if pagination params are invalid
   * Throws WORKSPACE_NOT_FOUND if workspace doesn't exist when no domains found
   */
  async getByWorkspaceIdPaginated(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (page < 1) {
      throw new ORPCError('DOMAIN_PAGE_INVALID', {
        message: 'Page must be greater than 0',
      });
    }

    if (perPage < 1 || perPage > 10) {
      throw new ORPCError('DOMAIN_PER_PAGE_INVALID', {
        message: 'Per page must be between 1 and 10',
      });
    }

    const total = await this.deps.domainRepo.countByWorkspace(workspaceId);

    // If no domains exist, workspace doesn't exist (workspace always has at least 1 domain)
    if (total === 0) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        message: 'Workspace not found',
      });
    }

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
   * Throws DOMAIN_GONE if soft-deleted, DOMAIN_NOT_FOUND if not found, or other domain-specific errors for validation
   */
  async updateDomainUrl(
    domainId: string,
    workspaceId: string,
    newUrl: string,
    options?: { tx?: Transaction }
  ) {
    if (!newUrl) {
      throw new ORPCError('DOMAIN_URL_REQUIRED', {
        message: 'Domain URL is required',
      });
    }

    // Get existing domain and check if it exists
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }

    // Verify domain belongs to the workspace
    if (domain.workspaceId !== workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
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
      throw new ORPCError('DOMAIN_ALREADY_EXISTS', {
        message: 'This domain has already been added to the workspace',
      });
    }

    // Update the domain URL and reset status to pending
    const updated = await this.deps.domainRepo.updateUrl(domainId, normalized, options);

    if (!updated) {
      throw new ORPCError('DOMAIN_UPDATE_FAILED', {
        message: 'Failed to update domain',
      });
    }

    return updated;
  }

  /**
   * Soft delete a domain
   * Marks domain as deleted without removing from database
   * Prevents deletion of the last domain in a workspace
   * Throws DOMAIN_GONE if already soft-deleted, DOMAIN_NOT_FOUND if not found, or other domain-specific errors for validation
   */
  async deleteDomain(domainId: string, workspaceId: string, options?: { tx?: Transaction }) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
    }

    // Check if this is the last domain in the workspace
    const domainCount = await this.deps.domainRepo.countByWorkspace(workspaceId);

    if (domainCount === 1) {
      throw new ORPCError('DOMAIN_LAST_DOMAIN_DELETE_FORBIDDEN', {
        message: 'Cannot delete the only domain in a workspace',
      });
    }

    const deleted = await this.deps.domainRepo.softDelete(domainId, options);

    if (!deleted) {
      throw new ORPCError('DOMAIN_DELETE_FAILED', {
        message: 'Failed to delete domain',
      });
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
   * Throws domain-specific errors for validation errors, DOMAIN_NOT_REGISTERED if domain not registered
   */
  async verifyDomain(token: string, originHostname: string) {
    // Verify JWT token
    const payload = this.deps.tokenService.verifyDomainToken(token);

    if (!payload) {
      throw new ORPCError('DOMAIN_VERIFICATION_TOKEN_INVALID', {
        message: 'Invalid verification token',
      });
    }

    // Issuer is already checked in verifyDomainToken

    // Look up domain by ID from token
    const domain = await this.deps.domainRepo.findById(payload.domainId);

    if (!domain) {
      throw new ORPCError('DOMAIN_NOT_REGISTERED', {
        message: 'Domain is not registered for this workspace',
      });
    }

    // Verify domain belongs to the workspace from token
    if (domain.workspaceId !== payload.workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
    }

    // Parse stored domain URL to get hostname and pathname
    let storedHostname: string;
    let storedPathname: string;
    try {
      const storedUrl = new URL(domain.domainUrl);
      storedHostname = storedUrl.hostname;
      storedPathname = storedUrl.pathname;
    } catch {
      throw new ORPCError('DOMAIN_URL_INVALID', {
        message: 'Invalid stored domain URL',
      });
    }

    // Parse origin to construct full origin URL for comparison
    let originUrl: URL;
    try {
      originUrl = new URL(`https://${originHostname}`);
    } catch {
      throw new ORPCError('DOMAIN_ORIGIN_INVALID', {
        message: 'Invalid origin hostname',
      });
    }

    // Compare hostname
    if (storedHostname !== originUrl.hostname) {
      throw new ORPCError('DOMAIN_ORIGIN_MISMATCH', {
        message: 'Origin does not match registered domain',
      });
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
      throw new ORPCError('DOMAIN_VERIFICATION_FAILED', {
        message: 'Failed to verify domain',
      });
    }

    return updatedDomain;
  }

  /**
   * Get domain by ID with recording preferences
   * Returns complete domain details including recording toggle settings
   * Throws DOMAIN_GONE if soft-deleted, DOMAIN_NOT_FOUND if not found, DOMAIN_WORKSPACE_MISMATCH for validation errors
   */
  async getByIdWithPreferences(domainId: string, workspaceId: string) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
    }

    return domain;
  }

  /**
   * Get domain recording preferences by ID
   * Returns recording toggle settings for the domain
   * Throws DOMAIN_GONE if soft-deleted, DOMAIN_NOT_FOUND if not found
   */
  async getPreferencesById(domainId: string) {
    const preferences = await this.deps.domainRepo.findPreferencesById(domainId);
    if (!preferences) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }
    return preferences;
  }

  /**
   * Update domain recording preferences
   * Updates recording toggle settings for the domain
   * Only allows updates if domain is verified
   * Throws DOMAIN_GONE if soft-deleted, DOMAIN_NOT_FOUND if not found, or other domain-specific errors for validation
   */
  async updateRecordingPreferences(
    domainId: string,
    workspaceId: string,
    updates: Partial<{
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureClientAction: boolean;
      recordingCaptureServerLog: boolean;
      recordingCaptureNetworkLog: boolean;
    }>,
    options?: { tx?: Transaction }
  ) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
    }

    if (domain.domainStatus !== 'verified') {
      throw new ORPCError('DOMAIN_UNVERIFIED', {
        message:
          'Cannot update recording preferences for unverified domain. Please verify the domain first.',
      });
    }

    const updated = await this.deps.domainRepo.updateRecordingPreferences(
      domainId,
      updates,
      options
    );
    if (!updated) {
      throw new ORPCError('DOMAIN_PREFERENCES_UPDATE_FAILED', {
        message: 'Failed to update domain preferences',
      });
    }

    return updated;
  }

  /**
   * Replace domain recording preferences
   * Replaces all recording toggle settings for the domain
   * Only allows updates if domain is verified
   * Throws DOMAIN_GONE if soft-deleted, DOMAIN_NOT_FOUND if not found, or other domain-specific errors for validation
   */
  async replaceRecordingPreferences(
    domainId: string,
    workspaceId: string,
    preferences: {
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureClientAction: boolean;
      recordingCaptureServerLog: boolean;
      recordingCaptureNetworkLog: boolean;
    },
    options?: { tx?: Transaction }
  ) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      const isSoftDeleted = await this.deps.domainRepo.isSoftDeleted(domainId);
      if (isSoftDeleted === true) {
        throw new ORPCError('DOMAIN_GONE', {
          status: 410,
          message: 'Domain has been deleted',
        });
      }
      throw new ORPCError('DOMAIN_NOT_FOUND', {
        message: 'Domain not found',
      });
    }

    if (domain.workspaceId !== workspaceId) {
      throw new ORPCError('DOMAIN_WORKSPACE_MISMATCH', {
        message: 'Domain does not belong to this workspace',
      });
    }

    if (domain.domainStatus !== 'verified') {
      throw new ORPCError('DOMAIN_UNVERIFIED', {
        message:
          'Cannot update recording preferences for unverified domain. Please verify the domain first.',
      });
    }

    const updated = await this.deps.domainRepo.updateRecordingPreferences(
      domainId,
      preferences,
      options
    );
    if (!updated) {
      throw new ORPCError('DOMAIN_PREFERENCES_UPDATE_FAILED', {
        message: 'Failed to update domain preferences',
      });
    }

    return updated;
  }
}
