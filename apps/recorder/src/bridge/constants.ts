/**
 * Constants for Recorder Bridge
 */

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
 * Generate a unique ID for scatter-gather requests
 */
export function generateRequestId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `req_${Date.now()}_${result}`;
}

/**
 * Check if a tab ID is a capture iframe
 */
export function isCaptureTab(tabId: string): boolean {
  return tabId.startsWith(`${CONNECTION_PREFIXES.CAPTURE}_`);
}

/**
 * Check if a tab ID is a recorder iframe
 */
export function isRecorderTab(tabId: string): boolean {
  return tabId.startsWith(`${CONNECTION_PREFIXES.RECORDER}_`);
}

/**
 * Check if a tab ID is a verification iframe
 */
export function isVerificationTab(tabId: string): boolean {
  return tabId.startsWith(`${CONNECTION_PREFIXES.VERIFICATION}_`);
}
