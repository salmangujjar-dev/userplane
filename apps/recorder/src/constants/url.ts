/**
 * URL parameter constants for Userplane recording flow
 */

/**
 * URL parameter names used in the recording flow
 */
export const URL_PARAMS = {
  TOKEN: 'userplane-token',
  ACTION: 'userplane-action',
  WORKSPACE: 'userplane-workspace',
  META: 'userplane-meta',
} as const;

/**
 * Action values for the recording/verification flow
 */
export const ACTIONS = {
  RECORDING: 'recording',
  VERIFY: 'verify',
} as const;

/**
 * Interface for URL parameters extracted from the query string
 */
export interface UrlParams {
  token: string;
  action: string;
  workspace: string;
}
