/**
 * DomainService - Domain service for domain operations
 * Contains business logic for domain management
 */

import { nanoid } from 'nanoid';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { ValidationError } from '@/api/lib/errors';
import { removeQueryParams } from '@/api/lib/utils';
import type { Transaction, CreateDomainParams } from '@/api/types';

export interface DomainServiceDeps {
  domainRepo: DomainRepository;
}

export class DomainService {
  constructor(private deps: DomainServiceDeps) {}

  /**
   * Create a new domain
   * Accepts any URL format and cleans it before storage
   * Stores protocol + hostname + path (removes query params and hash)
   */
  async create(params: CreateDomainParams, options?: { tx?: Transaction }) {
    if (!params.url) {
      throw new ValidationError('Domain URL is required');
    }

    // Clean URL: remove query parameters and hash, keep protocol + hostname + path
    const cleanUrl = removeQueryParams(params.url);

    return this.deps.domainRepo.create(
      {
        id: nanoid(),
        workspaceId: params.workspaceId,
        url: cleanUrl,
        domainStatus: params.status,
      },
      options
    );
  }
}
