/**
 * Session preferences extracted from session token
 * These preferences control UI customization and recording constraints
 */

import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_COMPANY_NAME,
} from '@/constants';
import type { z } from 'zod';
import {
  SessionPreferencesSchema,
  SessionTokenPayloadSchema,
  toRecordingPreferences as contractToRecordingPreferences,
  type RecordingPreferences,
} from '@workspace/contract';

/**
 * Session preferences from JWT token (inferred from contract)
 */
export type SessionPreferences = z.infer<typeof SessionPreferencesSchema>;

/**
 * Session token payload structure (inferred from contract)
 */
export type SessionTokenPayload = z.infer<typeof SessionTokenPayloadSchema>;

/**
 * UI-friendly representation of session preferences
 * Re-export from contract for convenience
 */
export type { RecordingPreferences };

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
  headerText: 'Get ready to record',
  footnoteText: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  maxDurationMs: DEFAULT_MAX_RECORDING_DURATION_MS,
  requestedBy: null,
};
