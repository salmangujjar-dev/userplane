/**
 * DomainService - Domain service for domain operations
 * Contains business logic for domain management
 */

import { nanoid } from 'nanoid';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { ValidationError } from '@/api/lib/errors';
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
   * Soft delete a domain
   * Marks domain as deleted without removing from database
   * Prevents deletion of the last domain in a workspace
   */
  async deleteDomain(domainId: string, workspaceId: string, options?: { tx?: Transaction }) {
    const domain = await this.deps.domainRepo.findById(domainId);

    if (!domain) {
      throw new ValidationError('Domain not found');
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
