/**
 * Shared domain-related types and utilities
 */

import { DomainRecordingPreferencesSchema, type DomainStatus } from '@workspace/contract';
import type { z } from 'zod';

/**
 * Domain recording preferences from API contract
 * This is the single source of truth for domain preferences
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

export interface DomainIdentifier {
  id: string;
  url: string;
}

export interface ConfiguringDomain {
  domainId: string;
  url: string;
  status: DomainStatus;
  settings: DomainRecordingPreferences | null;
}
