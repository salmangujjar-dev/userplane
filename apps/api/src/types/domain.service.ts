/**
 * Domain service types
 * Types for domain verification and management operations
 */

import type { DomainStatus } from '@workspace/contract';
import type { PaginationMeta } from './common';

/**
 * Parameters for creating a domain
 */
export interface CreateDomainParams {
  workspaceId: string;
  url: string;
  status: DomainStatus;
}
