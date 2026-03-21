/**
 * Shared error handling utilities for Zendesk app
 */

import { ZendeskApiError } from './api-client';

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
