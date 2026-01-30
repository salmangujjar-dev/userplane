/**
 * Types barrel export
 * Re-exports all types for convenient imports
 */

// Error types
export type { ErrorAction, ErrorActionButton, RecordingError, VerificationError } from './errors';
export { classifyError } from './errors';

// Session preferences
export type {
  RecordingPreferences,
  SessionPreferences,
  SessionTokenPayload,
} from './session-preferences';
export { DEFAULT_RECORDING_PREFERENCES, toRecordingPreferences } from './session-preferences';

// Session error codes (from contract)
export type { SessionErrorsType } from './session';
export { SessionErrors } from './session';
