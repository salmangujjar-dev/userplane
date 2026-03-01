/**
 * Domain-related types
 * Re-exports from @userplane/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

import { DomainStatus } from '@userplane/contract';
import type { z } from 'zod';

import { DomainRecordingPreferencesSchema } from '@/schemas';

// Re-export contract types
export type {
  DomainAddData,
  DomainItem,
  DomainStatus,
  DomainUpdateData,
  WorkspaceDomainsData,
} from '@userplane/contract';

// Aliases for backward compatibility
export type { DomainItem as WorkspaceDomain } from '@userplane/contract';
export type { DomainAddData as DomainResponse } from '@userplane/contract';
export type { WorkspaceDomainsData as DomainsData } from '@userplane/contract';

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
 * Domain identifier (frontend-specific for UI state)
 */
export interface DomainIdentifier {
  id: string;
  url: string;
}

/**
 * Domain being configured (frontend-specific for UI state)
 */
export interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: DomainStatus;
  settings: DomainRecordingPreferences | null;
}
