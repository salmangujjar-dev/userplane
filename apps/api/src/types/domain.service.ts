/**
 * Domain service types
 * Types for domain verification and management operations
 */

import type { DomainStatus } from './database';

/**
 * Parameters for creating a domain
 */
export interface CreateDomainParams {
  workspaceId: string;
  url: string;
  status: DomainStatus;
}
