/**
 * Universal logger that works in both Node.js and browser environments
 */

import type { CreateLoggerOptions } from './index';

// Detect environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Creates a logger that works in both server and browser environments
 * - Uses Pino on the server (Node.js/Bun)
 * - Uses browser-compatible logger in the browser
 */
export async function createUniversalLogger(context: string, options: CreateLoggerOptions = {}) {
  if (isBrowser) {
    const { createBrowserLogger } = await import('./browser');
    return createBrowserLogger(context, options.level);
  } else {
    const { createAppLogger } = await import('./factory');
    return createAppLogger(context, options);
  }
}

/**
 * Synchronous version - for server-side only contexts
 * Throws an error if used in browser
 */
export function createServerLogger(context: string, options: CreateLoggerOptions = {}) {
  if (isBrowser) {
    throw new Error(
      'createServerLogger cannot be used in browser. Use createUniversalLogger instead.'
    );
  }

  const { createAppLogger } = require('./factory');
  return createAppLogger(context, options);
}
