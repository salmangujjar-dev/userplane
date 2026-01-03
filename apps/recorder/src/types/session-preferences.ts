/**
 * Session preferences extracted from session token
 * These preferences control UI customization and recording constraints
 */

import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_COMPANY_NAME,
  DEFAULT_RECORDING_HEADER,
} from '@/constants';
import {
  toRecordingPreferences as contractToRecordingPreferences,
  type RecordingPreferences,
  type SessionPreferences,
  type SessionTokenPayload,
} from '@workspace/contract';

/**
 * Re-export types from contract for convenience
 * These are properly typed and maintained in the contract package
 */
export type { RecordingPreferences, SessionPreferences, SessionTokenPayload };

/**
 * Convert session preferences to UI preferences
 */
export function toRecordingPreferences(prefs: SessionPreferences): RecordingPreferences {
  return contractToRecordingPreferences(prefs);
}

/**
 * Default UI preferences when customization is disabled
 */
export const DEFAULT_RECORDING_PREFERENCES = {
  customizeLink: false,
  hideSensitive: false,
  captureClientLog: true,
  captureClientAction: true,
  captureServerLog: true,
  captureNetworkLog: true,
  companyName: DEFAULT_COMPANY_NAME,
  companyLogoUrl: null, // Will use /logo-dark.svg
  headerText: DEFAULT_RECORDING_HEADER,
  footnoteText: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  maxDurationMs: DEFAULT_MAX_RECORDING_DURATION_MS,
  requestedBy: null,
};
