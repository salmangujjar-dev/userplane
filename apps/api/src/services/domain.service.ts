/**
 * DomainService - Domain service for domain operations
 * Contains business logic for domain management
 */

import { nanoid } from 'nanoid';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { cleanUrl } from '@/api/lib/utils';
import type { Transaction, CreateDomainParams } from '@/api/types';

export interface DomainServiceDeps {
  domainRepo: DomainRepository;
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
        id: `dom_${nanoid(16)}`,
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
    const allDomains = await this.deps.domainRepo.findByWorkspaceId(workspaceId);

    if (allDomains.length === 1) {
      throw new ValidationError('Cannot delete the only domain in a workspace');
    }

    const deleted = await this.deps.domainRepo.softDelete(domainId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete domain');
    }

    return deleted;
  }
}
