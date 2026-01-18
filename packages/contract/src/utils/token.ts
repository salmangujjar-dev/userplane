/**
 * Token utility functions
 * Shared conversion utilities between API (encoding) and recorder/clients (decoding)
 */

import type { z } from 'zod';

import type { SessionPreferencesSchema } from '../schemas/token';

type SessionPreferences = z.infer<typeof SessionPreferencesSchema>;

/**
 * UI-friendly representation of session preferences
 * Converts compact JWT keys to readable property names
 */
export interface RecordingPreferences {
  customizeLink: boolean;
  hideSensitive: boolean;
  captureClientLog: boolean;
  captureClientAction: boolean;
  captureServerLog: boolean;
  captureNetworkLog: boolean;
  companyName: string | null;
  companyLogoUrl: string | null;
  headerText: string | null;
  footnoteText: string | null;
  primaryColor: string | null;
  maxDurationMs: number | null;
  requestedBy: string | null;
}

/**
 * Convert compact session preferences (JWT) to UI-friendly format
 */
export function toRecordingPreferences(prefs: SessionPreferences): RecordingPreferences {
  return {
    customizeLink: prefs.rcl,
    hideSensitive: prefs.rhs,
    captureClientLog: prefs.rccl,
    captureClientAction: prefs.rcca,
    captureServerLog: prefs.rcsl,
    captureNetworkLog: prefs.rcnl,
    companyName: prefs.rcn,
    companyLogoUrl: prefs.rclp,
    headerText: prefs.rh,
    footnoteText: prefs.rf,
    primaryColor: prefs.rpc,
    maxDurationMs: prefs.rmd,
    requestedBy: prefs.rrb,
  };
}

/**
 * Convert UI-friendly preferences back to compact JWT format
 */
export function toSessionPreferences(prefs: RecordingPreferences): SessionPreferences {
  return {
    rcl: prefs.customizeLink,
    rhs: prefs.hideSensitive,
    rccl: prefs.captureClientLog,
    rcca: prefs.captureClientAction,
    rcsl: prefs.captureServerLog,
    rcnl: prefs.captureNetworkLog,
    rcn: prefs.companyName,
    rclp: prefs.companyLogoUrl,
    rh: prefs.headerText,
    rf: prefs.footnoteText,
    rpc: prefs.primaryColor,
    rmd: prefs.maxDurationMs,
    rrb: prefs.requestedBy || '', // Default to empty string if null
  };
}
