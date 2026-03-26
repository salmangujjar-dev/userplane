/**
 * Centralized ID generation utilities
 * Uses nanoid with custom alphabet for consistent ID generation across the application
 */

import { customAlphabet } from 'nanoid';

/**
 * Custom alphabet for IDs: alphanumeric characters (0-9, A-Z, a-z)
 * Provides 62 possible characters per position
 */
const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Standard ID length for all entities
 * 12 characters provides ~3.76 quadrillion possible combinations
 */
const ID_LENGTH = 12;

/**
 * Custom nanoid generator with alphanumeric alphabet
 * Generates IDs like: "obltaPvaCIOQ"
 */
const nanoid = customAlphabet(ID_ALPHABET, ID_LENGTH);

/**
 * Generate a unique ID for links
 * No prefix - just the 12-character alphanumeric ID
 * @returns 12-character alphanumeric ID
 */
export function generateLinkId(): string {
  return nanoid();
}

/**
 * Generate a unique ID for workspaces
 * @returns ID with 'ws_' prefix + 12-character alphanumeric ID
 */
export function generateWorkspaceId(): string {
  return `ws_${nanoid()}`;
}

/**
 * Generate a unique ID for workspace members
 * @returns ID with 'wm_' prefix + 12-character alphanumeric ID
 */
export function generateWorkspaceMemberId(): string {
  return `mem_${nanoid()}`;
}

/**
 * Generate a unique ID for projects
 * @returns ID with 'proj_' prefix + 12-character alphanumeric ID
 */
export function generateProjectId(): string {
  return `proj_${nanoid()}`;
}

/**
 * Generate a unique ID for domains
 * @returns ID with 'dom_' prefix + 12-character alphanumeric ID
 */
export function generateDomainId(): string {
  return `dom_${nanoid()}`;
}

/**
 * Generate a unique ID for recordings
 * @returns ID with 'rec_' prefix + 12-character alphanumeric ID
 */
export function generateRecordingId(): string {
  return `rec_${nanoid()}`;
}

/**
 * Generate a unique invite token
 * @returns Token with 'inv_' prefix + 12-character alphanumeric ID
 */
export function generateInviteToken(): string {
  return `inv_${nanoid()}`;
}

/**
 * Generate a unique session ID for recording sessions
 * @returns ID with 'ses_' prefix + 12-character alphanumeric ID
 */
export function generateSessionId(): string {
  return `ses_${nanoid()}`;
}

/**
 * Generate a unique subscription ID
 * @returns ID with 'sub_' prefix + 12-character alphanumeric ID
 */
export function generateSubscriptionId(): string {
  return `sub_${nanoid()}`;
}

/**
 * Generate a unique entitlement ID
 * @returns ID with 'ent_' prefix + 12-character alphanumeric ID
 */
export function generateEntitlementId(): string {
  return `ent_${nanoid()}`;
}

/**
 * Generate a unique dispute ID
 * @returns ID with 'dsp_' prefix + 12-character alphanumeric ID
 */
export function generateDisputeId(): string {
  return `dsp_${nanoid()}`;
}

/**
 * Generate a unique refund ID
 * @returns ID with 'rfd_' prefix + 12-character alphanumeric ID
 */
export function generateRefundId(): string {
  return `rfd_${nanoid()}`;
}

/**
 * Generate a unique ID for integrations
 * @returns ID with 'int_' prefix + 12-character alphanumeric ID
 */
export function generateIntegrationId(): string {
  return `int_${nanoid()}`;
}

/**
 * Short suffix length for fallback link titles
 * 4 characters with 62-char alphabet = ~14.7 million combinations
 */
const TITLE_SUFFIX_LENGTH = 4;
const titleSuffixGenerator = customAlphabet(ID_ALPHABET, TITLE_SUFFIX_LENGTH);

/**
 * Generate a short random suffix for fallback link titles
 * @returns 4-character alphanumeric string (e.g., "a3Kx")
 */
function generateTitleSuffix(): string {
  return titleSuffixGenerator();
}

/**
 * Determine the link title to store.
 * Returns the provided title if non-empty, otherwise generates a unique fallback.
 * - With name: "{firstName}'s Recording Link #XXXX"
 * - Without name: "Recording Link #XXXX"
 */
export function determineLinkTitle(title?: string | null, createdByName?: string | null): string {
  if (title && title.trim() !== '') {
    return title;
  }

  const suffix = generateTitleSuffix();
  const firstName = createdByName?.trim().split(/\s+/)[0];

  if (!firstName) {
    return `Recording Link #${suffix}`;
  }
  return `${firstName}'s Recording Link #${suffix}`;
}

/**
 * Export the raw nanoid generator for cases where custom prefixes are needed
 */
export { nanoid };

/**
 * Export constants for testing or validation
 */
export const ID_CONSTANTS = {
  ALPHABET: ID_ALPHABET,
  LENGTH: ID_LENGTH,
} as const;
