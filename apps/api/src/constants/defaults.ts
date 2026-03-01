/**
 * Default values for workspace recording preferences
 * Re-exports from contract package for convenient access
 */

import { RECORDING_DEFAULTS, RECORDING_DURATION_LIMITS } from '@userplane/contract';

/**
 * Default company name displayed in recordings
 */
export const DEFAULT_RECORDING_COMPANY_NAME = RECORDING_DEFAULTS.COMPANY_NAME;

/**
 * Default header text shown before recording starts
 */
export const DEFAULT_RECORDING_HEADER = RECORDING_DEFAULTS.HEADER;

/**
 * Default footnote text (null means no footnote)
 */
export const DEFAULT_RECORDING_FOOTNOTE = RECORDING_DEFAULTS.FOOTNOTE;

/**
 * Default primary color for recording UI
 */
export const DEFAULT_RECORDING_PRIMARY_COLOR = RECORDING_DEFAULTS.PRIMARY_COLOR;

/**
 * Default maximum recording duration in milliseconds (3 minutes)
 */
export const DEFAULT_RECORDING_MAX_DURATION_MS = RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS;

/**
 * Default recording preferences for new workspaces
 * Uses the same values as the recorder app's DEFAULT_RECORDING_PREFERENCES
 */
export interface DefaultRecordingPreferences {
  recordingCompanyName: string;
  recordingHeader: string;
  recordingFootnote: string | null;
  recordingPrimaryColor: string;
  recordingMaxDurationMs: number;
}

/**
 * Get default recording preferences for workspace creation
 * These match the recorder app's DEFAULT_RECORDING_PREFERENCES to ensure consistency
 */
export function getDefaultRecordingPreferences(): DefaultRecordingPreferences {
  return {
    recordingCompanyName: DEFAULT_RECORDING_COMPANY_NAME,
    recordingHeader: DEFAULT_RECORDING_HEADER,
    recordingFootnote: DEFAULT_RECORDING_FOOTNOTE,
    recordingPrimaryColor: DEFAULT_RECORDING_PRIMARY_COLOR,
    recordingMaxDurationMs: DEFAULT_RECORDING_MAX_DURATION_MS,
  };
}
