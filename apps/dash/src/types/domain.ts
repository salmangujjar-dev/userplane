/**
 * Domain-related types
 * Re-exports from @workspace/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

import { DomainStatus } from '@workspace/contract';
import type { z } from 'zod';

import { DomainRecordingPreferencesSchema } from '@/schemas';

// Re-export contract types
export type {
  DomainAddData,
  DomainItem,
  DomainStatus,
  DomainUpdateData,
  WorkspaceDomainsData,
} from '@workspace/contract';

// Aliases for backward compatibility
export type { DomainItem as WorkspaceDomain } from '@workspace/contract';
export type { DomainAddData as DomainResponse } from '@workspace/contract';
export type { WorkspaceDomainsData as DomainsData } from '@workspace/contract';

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
