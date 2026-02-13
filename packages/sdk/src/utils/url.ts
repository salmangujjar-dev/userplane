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
