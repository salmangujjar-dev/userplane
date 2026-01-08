/**
 * Verification Error Handling
 * Type-locked config for domain verification errors
 */

import type { VerificationError } from '@/types/errors';

/**
 * Verification error codes - descriptive, self-documenting
 */
export const VerificationErrors = {
  // Token errors
  VERIFICATION_TOKEN_INVALID: {},
  VERIFICATION_TOKEN_MISSING: {},

  // Domain errors
  VERIFICATION_DOMAIN_NOT_REGISTERED: {},
  VERIFICATION_DOMAIN_URL_INVALID: {},

  // Workspace errors
  VERIFICATION_WORKSPACE_MISMATCH: {},
  VERIFICATION_WORKSPACE_MISSING: {},

  // Origin errors
  VERIFICATION_ORIGIN_INVALID: {},
  VERIFICATION_ORIGIN_MISMATCH: {},

  // Verification result errors
  VERIFICATION_FAILED: {},

  // Bridge errors
  VERIFICATION_BRIDGE_NOT_CONNECTED: {},
  VERIFICATION_BRIDGE_COMMUNICATION_ERROR: {},
  VERIFICATION_BRIDGE_NOT_EMBEDDED: {},

  // Network errors
  VERIFICATION_NETWORK_ERROR: {},

  // Generic errors
  VERIFICATION_UNKNOWN_ERROR: {},
} as const;

export type VerificationErrorCode = keyof typeof VerificationErrors;

/**
 * Verification error config - type-locked to VerificationErrors
 */
const VERIFICATION_ERROR_CONFIG: Record<VerificationErrorCode, VerificationError> = {
  // Token errors
  VERIFICATION_TOKEN_INVALID: {
    title: 'This link has expired',
    subtitle: 'Just request a new verification link to continue.',
  },
  VERIFICATION_TOKEN_MISSING: {
    title: 'This link has expired',
    subtitle: 'Just request a new verification link to continue.',
  },

  // Domain errors
  VERIFICATION_DOMAIN_NOT_REGISTERED: {
    title: "We can't find this domain yet",
    subtitle: 'Once you add the domain to your workspace, you can come back and verify it.',
  },
  VERIFICATION_DOMAIN_URL_INVALID: {
    title: 'Invalid domain',
    subtitle: "The domain doesn't look right, let's double check and try again.",
  },

  // Workspace errors
  VERIFICATION_WORKSPACE_MISMATCH: {
    title: 'Workspace mismatch',
    subtitle:
      'This link belongs to another workspace. Review your domain and workspace settings and try again.',
  },
  VERIFICATION_WORKSPACE_MISSING: {
    title: 'Missing workspace',
    subtitle: 'No workspace ID provided for verification.',
  },

  // Origin errors
  VERIFICATION_ORIGIN_INVALID: {
    title: 'Invalid origin',
    subtitle: 'For security reasons, this step needs to happen from the registered domain.',
  },
  VERIFICATION_ORIGIN_MISMATCH: {
    title: 'Origin mismatch',
    subtitle: "Let's open this link from the domain you're trying to verify.",
  },

  // Verification result errors
  VERIFICATION_FAILED: {
    title: 'Verification failed',
    subtitle: 'Could not verify domain ownership. Try again, or review your domain settings.',
  },

  // Bridge errors
  VERIFICATION_BRIDGE_NOT_CONNECTED: {
    title: 'Connection Error',
    subtitle: 'Unable to connect to the parent application. Please try refreshing the page.',
  },
  VERIFICATION_BRIDGE_COMMUNICATION_ERROR: {
    title: 'Communication Error',
    subtitle: 'Failed to communicate with the parent application.',
  },
  VERIFICATION_BRIDGE_NOT_EMBEDDED: {
    title: 'Connection Required',
    subtitle: 'Verification must be run from an embedded context with the SDK.',
  },

  // Network errors
  VERIFICATION_NETWORK_ERROR: {
    title: 'Connection issue',
    subtitle: "We couldn't reach the servers. Let's try again.",
  },

  // Generic errors
  VERIFICATION_UNKNOWN_ERROR: {
    title: 'Something went wrong',
    subtitle: "That didn't work. Let's try again.",
  },
};

/**
 * Map raw API error code to VerificationErrorCode
 */
const API_CODE_MAP: Record<string, VerificationErrorCode> = {
  DOMAIN_VERIFICATION_TOKEN_INVALID: 'VERIFICATION_TOKEN_INVALID',
  DOMAIN_NOT_REGISTERED: 'VERIFICATION_DOMAIN_NOT_REGISTERED',
  DOMAIN_WORKSPACE_MISMATCH: 'VERIFICATION_WORKSPACE_MISMATCH',
  DOMAIN_URL_INVALID: 'VERIFICATION_DOMAIN_URL_INVALID',
  DOMAIN_ORIGIN_INVALID: 'VERIFICATION_ORIGIN_INVALID',
  DOMAIN_ORIGIN_MISMATCH: 'VERIFICATION_ORIGIN_MISMATCH',
  DOMAIN_VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INTERNAL_SERVER_ERROR: 'VERIFICATION_UNKNOWN_ERROR',
  NETWORK_ERROR: 'VERIFICATION_NETWORK_ERROR',
};

/**
 * Create a verification error from error code
 */
export function createVerificationError(code: VerificationErrorCode): VerificationError {
  return VERIFICATION_ERROR_CONFIG[code];
}

/**
 * Classify raw verification API error code to VerificationError
 */
export function classifyVerificationApiError(apiCode: string): VerificationError {
  const errorCode = API_CODE_MAP[apiCode] ?? 'VERIFICATION_UNKNOWN_ERROR';
  return { ...VERIFICATION_ERROR_CONFIG[errorCode], code: apiCode };
}

/**
 * Get verification error by code (for stories/testing)
 */
export function getVerificationError(code: VerificationErrorCode): VerificationError {
  return VERIFICATION_ERROR_CONFIG[code];
}
