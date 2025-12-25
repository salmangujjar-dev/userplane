/**
 * UI constants
 * Colors, timings, and display defaults
 */

import { RECORDING_DEFAULTS } from '@workspace/contract';

// ===========================================
// Colors and Branding (from contract)
// ===========================================

/** Default primary color (black) */
export const DEFAULT_PRIMARY_COLOR = RECORDING_DEFAULTS.PRIMARY_COLOR;

/** Default branding company name */
export const DEFAULT_COMPANY_NAME = RECORDING_DEFAULTS.COMPANY_NAME;

/** Default header text shown before recording starts */
export const DEFAULT_RECORDING_HEADER = RECORDING_DEFAULTS.HEADER;

// ===========================================
// Countdown
// ===========================================

/** Countdown duration before recording starts (seconds) */
export const COUNTDOWN_SECONDS = 3;

/** Countdown tick interval in milliseconds */
export const COUNTDOWN_INTERVAL_MS = 1000;

// ===========================================
// Auto-close
// ===========================================

/** Delay before auto-closing window after success (milliseconds) */
export const SUCCESS_AUTO_CLOSE_DELAY_MS = 5000;

// ===========================================
// Session Initialization
// ===========================================

/** Timeout for session initialization in milliseconds */
export const SESSION_INIT_TIMEOUT_MS = 15000;
