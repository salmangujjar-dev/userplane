/**
 * URL parsing utilities
 * Handles extraction and validation of URL parameters.
 */

import { ACTIONS, URL_PARAMS } from '../constants';
import type { ActionType, URLParams } from '../types';

/**
 * Valid action values
 */
const VALID_ACTIONS: string[] = [ACTIONS.RECORDING, ACTIONS.VERIFY];

/**
 * Parse URL parameters to check for userplane action.
 * Extracts and validates token and action from current URL.
 *
 * @returns URLParams object if valid action detected, null otherwise
 */
export function parseUrlParams(): URLParams | null {
  const params = new URLSearchParams(window.location.search);
  const action = params.get(URL_PARAMS.ACTION);
  const token = params.get(URL_PARAMS.TOKEN);

  if (action && VALID_ACTIONS.includes(action) && token) {
    return { token, action: action as ActionType };
  }

  return null;
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
