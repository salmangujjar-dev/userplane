/**
 * Tab reference utilities
 * Generates unique references for browser tabs/windows
 *
 * Uses window.name which:
 * - Persists across page refreshes (same tab keeps same ID)
 * - Is unique per tab (each tab has its own window.name)
 * - Is NOT copied when duplicating a tab (new tab gets empty window.name)
 * - Survives navigation within the same tab
 */

import { customAlphabet } from 'nanoid';

const TAB_REF_PREFIX = 'userplane_tab_';

// Alphanumeric only (A-Z, a-z, 0-9)
const generateId = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  21
);

/**
 * Get or create a tab reference
 * Uses window.name for persistence - simple and reliable
 *
 * @returns Tab reference (format: userplane_tab_[nanoid])
 */
export function getOrCreateTabRef(): string {
  if (typeof window === 'undefined') {
    return `${TAB_REF_PREFIX}${generateId()}`;
  }

  // Check if we already have a tab ref in window.name
  if (window.name.startsWith(TAB_REF_PREFIX)) {
    return window.name;
  }

  // Generate new tab ref and store in window.name
  const tabRef = `${TAB_REF_PREFIX}${generateId()}`;
  window.name = tabRef;

  return tabRef;
}

/**
 * Clear the tab reference
 * Useful for testing or debugging
 */
export function clearTabRef(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.name.startsWith(TAB_REF_PREFIX)) {
    window.name = '';
  }
}

/**
 * Get the current tab reference without creating one
 * Returns null if no tab ref exists
 */
export function getTabRef(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.name.startsWith(TAB_REF_PREFIX)) {
    return window.name;
  }

  return null;
}
