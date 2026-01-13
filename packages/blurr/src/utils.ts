/**
 * Utility functions
 */

import type { Logger } from './types';

// ═══════════════════════════════════════════════════════════
// GLOBAL DEBUG LOGGER
// ═══════════════════════════════════════════════════════════

let globalDebugEnabled = false;

/**
 * Enable/disable global debug mode
 */
export function setGlobalDebug(enabled: boolean): void {
  globalDebugEnabled = enabled;
}

/**
 * Check if global debug is enabled
 */
export function isDebugEnabled(): boolean {
  return globalDebugEnabled;
}

/**
 * Global debug log - only logs when debug is enabled
 */
export function debugLog(module: string, message: string, data?: unknown): void {
  if (globalDebugEnabled) {
    const prefix = `[Blurr:${module}]`;
    if (data !== undefined) {
      console.debug(prefix, message, data);
    } else {
      console.debug(prefix, message);
    }
  }
}

/**
 * Global trace log - for detailed execution tracing
 */
export function traceLog(
  module: string,
  fn: string,
  phase: 'enter' | 'exit',
  data?: unknown
): void {
  if (globalDebugEnabled) {
    const prefix = `[Blurr:${module}]`;
    const arrow = phase === 'enter' ? '→' : '←';
    if (data !== undefined) {
      console.debug(prefix, `${arrow} ${fn}`, data);
    } else {
      console.debug(prefix, `${arrow} ${fn}`);
    }
  }
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string, debug = false): Logger {
  const prefix = `[${namespace}]`;

  return {
    log: debug ? console.log.bind(console, prefix) : () => {},
    warn: console.warn.bind(console, prefix),
    error: console.error.bind(console, prefix),
    debug: debug ? console.debug.bind(console, prefix) : () => {},
  };
}

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
}

/**
 * Check if browser supports required APIs
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!isBrowser()) {
    return { supported: false, missing: ['browser environment'] };
  }

  if (typeof MutationObserver === 'undefined') {
    missing.push('MutationObserver');
  }

  if (typeof window.getComputedStyle === 'undefined') {
    missing.push('getComputedStyle');
  }

  // XPath is optional - we have a fallback
  // if (typeof document.evaluate === 'undefined') {
  //   missing.push('XPath (document.evaluate)');
  // }

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Safe element matches check
 */
export function matchesSelector(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return false;
  }
}

/**
 * Safe querySelectorAll
 */
export function querySelectorAllSafe(root: Element | Document, selector: string): Element[] {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: Element): boolean {
  const htmlElement = element as HTMLElement;

  if (htmlElement.style.display === 'none') return false;
  if (htmlElement.style.visibility === 'hidden') return false;
  if (htmlElement.style.opacity === '0') return false;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  return true;
}

/**
 * Get attribute value with fallbacks
 */
export function getAttributeValue(element: Element, ...attributes: string[]): string | null {
  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

/**
 * Parse boolean from string
 */
export function parseBoolean(value: string | null | undefined): boolean {
  if (!value) return false;

  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

/**
 * Performance measurement helper
 */
export function measurePerformance<T>(_name: string, fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  return { result, duration };
}

/**
 * Async performance measurement
 */
export async function measurePerformanceAsync<T>(
  _name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  return { result, duration };
}

/**
 * Create a unique ID
 */
export function createUniqueId(prefix = 'blurr'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects
 */
export function merge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }
  return target;
}
