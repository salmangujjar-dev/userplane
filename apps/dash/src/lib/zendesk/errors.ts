/**
 * Zendesk app error handling utilities
 * Uses contract-defined error codes from ORPC errors
 */

import { ORPCError } from '@userplane/client';

/**
 * Dedicated view types for specific error codes.
 * Returns null if the error should fall through to the generic error screen.
 */
export type ErrorView = 'signup' | 'access_requested' | 'limit_exceeded' | 'reconnect';

export function getErrorView(err: unknown): ErrorView | null {
  if (!(err instanceof ORPCError)) return null;

  switch (err.code) {
    case 'ZENDESK_APP_UNAUTHORIZED':
      return 'reconnect';
    case 'ZENDESK_APP_AGENT_NOT_FOUND':
      return 'signup';
    case 'ZENDESK_APP_AGENT_NOT_MEMBER':
      return 'access_requested';
    case 'ZENDESK_APP_RECORDING_LIMIT_EXCEEDED':
      return 'limit_exceeded';
    default:
      return null;
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ORPCError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred';
}
