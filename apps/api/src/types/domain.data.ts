/**
 * Domain API Data Types
 * Data types for domain-related API responses
 */

import type { PaginationMeta } from './common';
import type { DomainItem } from './workspace.service';
import type { Domain } from '@workspace/db';

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

export interface DomainVerificationData {
  domainStatus: Domain['domainStatus'];
  workspaceId: string;
  domainId: string;
  domainUrl: string;
}

export interface DomainVerificationTokenPayload {
  iss: string;
  workspaceId: string;
  domainId: string;
  url: string;
  iat: number;
  exp: number;
}
