/**
 * URL parsing utilities for recording app
 */

import { URL_PARAMS, type UrlParams } from '@/constants/url';

/**
 * Read URL parameters during initial render (SSR-safe)
 * Extracts userplane-specific query parameters from the URL
 */
export function getUrlParams(): UrlParams {
  if (typeof window === 'undefined') {
    return { token: '', action: '', workspace: '' };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get(URL_PARAMS.TOKEN) || '',
    action: params.get(URL_PARAMS.ACTION) || '',
    workspace: params.get(URL_PARAMS.WORKSPACE) || '',
  };
}

/**
 * Parse `userplane-meta` query parameter into key-value pairs.
 *
 * Format: `?userplane-meta=key1%3Dval1,key2%3Dval2`
 * After decoding: `key1=val1,key2=val2`
 *
 * @returns Record of key-value pairs, or null if param is absent
 */
export function parseMetaParams(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get(URL_PARAMS.META);

  if (!raw) return null;

  const result: Record<string, string> = {};

  for (const entry of raw.split(',')) {
    const eqIndex = entry.indexOf('=');
    if (eqIndex === -1) continue;

    const key = decodeURIComponent(entry.slice(0, eqIndex)).trim();
    const value = decodeURIComponent(entry.slice(eqIndex + 1));

    if (key) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parse comma-separated workspace IDs from URL parameter
 * Handles trimming whitespace and filtering empty values
 *
 * @param workspaceParam - Comma-separated workspace IDs (e.g., "ws_123,ws_456")
 * @returns Array of workspace IDs
 */
export function parseWorkspaceIds(workspaceParam: string): string[] {
  if (!workspaceParam) {
    return [];
  }
  return workspaceParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}
