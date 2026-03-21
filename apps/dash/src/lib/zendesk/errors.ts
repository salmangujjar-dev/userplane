/**
 * Shared error handling utilities for Zendesk app
 */

import { ZendeskApiError } from './api-client';

// Error codes returned by the Zendesk API
export const ZENDESK_ERROR_CODES = {
  RECORDING_LIMIT_EXCEEDED: 'RECORDING_LIMIT_EXCEEDED',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_NOT_MEMBER: 'AGENT_NOT_MEMBER',
} as const;

export type ZendeskErrorCode = (typeof ZENDESK_ERROR_CODES)[keyof typeof ZENDESK_ERROR_CODES];

/**
 * Dedicated view types for specific error codes.
 * Returns null if the error should fall through to the generic error screen.
 */
export type ErrorView = 'signup' | 'access_requested' | 'limit_exceeded' | 'reconnect';

export function getErrorView(err: unknown): ErrorView | null {
  if (err instanceof ZendeskApiError) {
    if (err.status === 401) return 'reconnect';
    switch (err.code) {
      case ZENDESK_ERROR_CODES.AGENT_NOT_FOUND:
        return 'signup';
      case ZENDESK_ERROR_CODES.AGENT_NOT_MEMBER:
        return 'access_requested';
      case ZENDESK_ERROR_CODES.RECORDING_LIMIT_EXCEEDED:
        return 'limit_exceeded';
    }
  }
  return null;
}

const ERROR_MESSAGES: Record<string, string> = {
  RECORDING_LIMIT_EXCEEDED: 'Recording limit exceeded. Upgrade your plan in the dashboard.',
  AGENT_NOT_FOUND: 'Your email is not registered with Userplane. Contact your admin.',
  AGENT_NOT_MEMBER: 'You are not a member of this workspace. Contact your admin.',
};

export function getErrorMessage(err: unknown): string {
  if (err instanceof ZendeskApiError && err.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[err.code]!;
  }
  return 'Failed to create link';
}
