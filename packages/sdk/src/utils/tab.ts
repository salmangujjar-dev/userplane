/**
 * Tab reference utilities
 * Generates unique references for browser tabs/windows
 * Tab refs persist in sessionStorage for the lifetime of the tab
 */

import { nanoid } from 'nanoid';

declare global {
  interface Window {
    __userplaneTabRef?: string;
  }
}

const STORAGE_KEY = 'userplane_tab_ref';

/**
 * Generate a unique tab reference
 * Uses nanoid for cryptographically strong random IDs
 *
 * Format: tab_[nanoid]
 * Example: tab_V1StGXR8_Z5jdHi6B
 *
 * @returns Unique tab reference
 */
function generateTabRef(): string {
  return `tab_${nanoid()}`;
}

/**
 * Get or create a tab reference
 * Checks in order:
 * 1. Window namespace (in-memory)
 * 2. sessionStorage (survives refresh, unique per tab)
 * 3. Generate new one and store it
 *
 * This ensures the same tab ref persists across page refreshes within the same tab
 * and if the SDK is re-initialized within the same page load
 *
 * @returns Tab reference
 */
export function getOrCreateTabRef(): string {
  if (typeof window === 'undefined') {
    return generateTabRef();
  }

  // Check window namespace first (fastest)
  if (window.__userplaneTabRef) {
    return window.__userplaneTabRef;
  }

  // Check sessionStorage (survives refresh, clears when tab closes)
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      window.__userplaneTabRef = stored;
      return stored;
    }
  } catch (error) {
    // sessionStorage might be disabled or unavailable
    console.warn('[Userplane] sessionStorage unavailable:', error);
  }

  // Generate new tab ref and store it
  const tabRef = generateTabRef();
  window.__userplaneTabRef = tabRef;

  try {
    sessionStorage.setItem(STORAGE_KEY, tabRef);
  } catch (error) {
    // sessionStorage write failed (quota, disabled, etc.)
    console.warn('[Userplane] Failed to store tab ref in sessionStorage:', error);
  }

  return tabRef;
}

/**
 * Clear the tab reference from sessionStorage and window
 * Useful for testing or debugging
 */
export function clearTabRef(): void {
  if (typeof window === 'undefined') {
    return;
  }

  delete window.__userplaneTabRef;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Userplane] Failed to clear tab ref from sessionStorage:', error);
  }
}
