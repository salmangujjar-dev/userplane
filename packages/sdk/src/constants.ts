/**
 * Constants for Userplane SDK
 */

/**
 * URL parameter names used by the recorder
 */
export const URL_PARAMS = {
  TOKEN: 'userplane-token',
  ACTION: 'userplane-action',
  WORKSPACE: 'userplane-workspace',
} as const;

/**
 * Action values for the recorder/verification
 */
export const ACTIONS = {
  RECORDING: 'recording',
  VERIFY: 'verify',
  CAPTURE: 'capture',
} as const;

/**
 * Connection ID prefixes for different frame types
 * Used for cross-tab coordination and scatter-gather identification
 */
export const CONNECTION_PREFIXES = {
  RECORDER: 'rec',
  VERIFICATION: 'vrd',
  CAPTURE: 'cap',
} as const;

/**
 * Generate a prefixed connection ID for a given frame type
 * Format: {prefix}_{tabRef}
 */
export function generateConnectionId(prefix: string, tabRef: string): string {
  return `${prefix}_${tabRef}`;
}

/**
 * Parse a connection ID to extract prefix and tabRef
 */
export function parseConnectionId(connectionId: string): { prefix: string; tabRef: string } | null {
  const parts = connectionId.split('_');
  if (parts.length < 2) return null;
  const prefix = parts[0]!;
  const tabRef = parts.slice(1).join('_');
  return { prefix, tabRef };
}

/**
 * Meta tag selector for workspace ID
 */
export const META_SELECTORS = {
  WORKSPACE: 'meta[name="userplane:workspace"]',
} as const;
