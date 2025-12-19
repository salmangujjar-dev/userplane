/**
 * Session preferences extracted from session token
 * These preferences control UI customization and recording constraints
 */

import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_COMPANY_NAME,
} from '@/constants';
import { RECORDING_DURATION_LIMITS } from '@workspace/contract';

/**
 * Session preferences from JWT token
 * Matches the SessionPreferences type from apps/api/src/types/session.data.ts
 */
export interface SessionPreferences {
  rcl: boolean; // recording_customize_link - Enable custom branding
  rhs: boolean; // recording_hide_sensitive - Hide sensitive data
  rccl: boolean; // recording_capture_client_log - Capture console logs
  rcsl: boolean; // recording_capture_server_log - Capture network logs
  rcn: string | null; // recording_company_name - Company name
  rclp: string | null; // recording_company_logo_path - Logo URL/path
  rh: string | null; // recording_header - Custom header text
  rf: string | null; // recording_footnote - Custom footnote text
  rpc: string | null; // recording_primary_color - Primary brand color
  rmd: number | null; // recording_max_duration_ms - Max duration in milliseconds
  rrb: string; // recording_requested_by - Requester ID
}

/**
 * Session token payload structure
 */
export interface SessionTokenPayload {
  iss: string; // Issuer
  lid: string; // Link ID
  lt: string; // Link Type
  wid: string; // Workspace ID
  sid: string; // Session ID
  prefs: SessionPreferences; // Session preferences
  iat: number; // Issued at
  exp: number; // Expiry
}

/**
 * UI-friendly representation of session preferences
 */
export interface RecordingPreferences {
  customizeLink: boolean;
  companyName: string | null;
  companyLogoUrl: string | null;
  headerText: string | null;
  footnoteText: string | null;
  primaryColor: string | null;
  maxDurationMs: number; // milliseconds (default from RECORDING_DURATION_LIMITS)
  requestedBy: string | null;
}

/**
 * Convert session preferences to UI preferences
 */
export function toRecordingPreferences(prefs: SessionPreferences): RecordingPreferences {
  return {
    customizeLink: prefs.rcl,
    companyName: prefs.rcn,
    companyLogoUrl: prefs.rclp,
    headerText: prefs.rh,
    footnoteText: prefs.rf,
    primaryColor: prefs.rpc,
    maxDurationMs: prefs.rmd ?? RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS,
    requestedBy: prefs.rrb || null,
  };
}

/**
 * Default UI preferences when customization is disabled
 */
export const DEFAULT_RECORDING_PREFERENCES: RecordingPreferences = {
  customizeLink: false,
  companyName: DEFAULT_COMPANY_NAME,
  companyLogoUrl: null, // Will use /logo-dark.svg
  headerText: 'Get ready to record',
  footnoteText: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  maxDurationMs: DEFAULT_MAX_RECORDING_DURATION_MS,
  requestedBy: null,
};
