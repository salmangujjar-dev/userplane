/**
 * Domain-related types
 */

import { DomainRecordingPreferencesSchema, type DomainStatus } from '@workspace/contract';
import type { z } from 'zod';

import type { PaginationMeta } from './common';

/**
 * Domain recording preferences from API contract
 * Single source of truth for domain preferences
 */
export type DomainRecordingPreferences = z.infer<typeof DomainRecordingPreferencesSchema>;

/**
 * Default domain recording preferences
 */
export const DEFAULT_DOMAIN_RECORDING_PREFERENCES: DomainRecordingPreferences = {
  recordingHideSensitive: false,
  recordingCaptureClientLog: false,
  recordingCaptureClientAction: false,
  recordingCaptureNetworkLog: false,
  recordingCaptureServerLog: false,
};

/**
 * Re-export DomainStatus from contract for convenience
 */
export type { DomainStatus };

/**
 * Domain identifier
 */
export interface DomainIdentifier {
  id: string;
  url: string;
}

/**
 * Domain being configured
 */
export interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: DomainStatus;
  settings: DomainRecordingPreferences | null;
}

/**
 * Domain object
 * Used in both list and detail views
 */
export interface WorkspaceDomain {
  domainId: string;
  domainUrl: string;
  domainStatus: DomainStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Domain response from create/update operations
 */
export interface DomainResponse {
  domain: {
    domainId: string;
    domainUrl: string;
    domainStatus: DomainStatus;
    createdAt: string;
    updatedAt: string;
  };
  workspaceId: string;
}

/**
 * Domains list response
 */
export interface DomainsData {
  domains: WorkspaceDomain[];
  pagination: PaginationMeta;
}
