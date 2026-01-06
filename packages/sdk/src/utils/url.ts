/**
 * URL parsing utilities
 * Handles extraction and validation of URL parameters.
 */

import type { URLParams } from '../types';
import { URL_PARAMS, ACTIONS } from '../constants';

/**
 * Parse URL parameters to check for recording action.
 * Extracts and validates recording token and action from current URL.
 *
 * @returns URLParams object if valid recording action detected, null otherwise
 */
export function parseUrlParams(): URLParams | null {
  const params = new URLSearchParams(window.location.search);
  const action = params.get(URL_PARAMS.ACTION);
  const token = params.get(URL_PARAMS.TOKEN);

  if (action === ACTIONS.RECORDING && token) {
    return { token, action };
  }

  return null;
}
