/**
 * Domain API Data Types
 * Data types for domain-related API responses
 */

import type { PaginationMeta } from './common';
import type { DomainItem } from './workspace.service';

export interface WorkspaceDomainsData {
  workspaceId: string;
  domains: DomainItem[];
  pagination: PaginationMeta;
}

export interface DomainAddData {
  workspaceId: string;
  domain: DomainItem;
}

export interface DomainUpdateData {
  workspaceId: string;
  domain: DomainItem;
}

export interface DomainDeleteData {
  workspaceId: string;
  domainId: string;
}
