/**
 * Session preferences extracted from session token
 * These preferences control UI customization and recording constraints
 */

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
  rmd: number | null; // recording_max_duration - Max duration in seconds
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
export interface UIPreferences {
  customizeLink: boolean;
  companyName: string | null;
  companyLogoUrl: string | null;
  headerText: string | null;
  footnoteText: string | null;
  primaryColor: string | null;
  maxDuration: number; // milliseconds (default 180000 = 3 minutes)
  requestedBy: string | null;
}

/**
 * Convert session preferences to UI preferences
 */
export function toUIPreferences(prefs: SessionPreferences): UIPreferences {
  return {
    customizeLink: prefs.rcl,
    companyName: prefs.rcn,
    companyLogoUrl: prefs.rclp,
    headerText: prefs.rh,
    footnoteText: prefs.rf,
    primaryColor: prefs.rpc,
    maxDuration: prefs.rmd ? prefs.rmd * 1000 : 180000, // Convert seconds to ms, default 3 minutes
    requestedBy: prefs.rrb || null,
  };
}

/**
 * Default UI preferences when customization is disabled
 */
export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  customizeLink: false,
  companyName: 'Userplane',
  companyLogoUrl: null, // Will use /logo-dark.svg
  headerText: 'Get ready to record',
  footnoteText: null,
  primaryColor: '#000000',
  maxDuration: 180000, // 3 minutes default
  requestedBy: null,
};
