/**
 * Constants for Userplane SDK
 */

/**
 * URL parameter names used by the recorder
 */
export const URL_PARAMS = {
  TOKEN: 'userplane-token',
  ACTION: 'userplane-action',
  WORKSPACE: 'userplane-workspace',
} as const;

/**
 * Action values for the recorder
 */
export const ACTIONS = {
  RECORDING: 'recording',
} as const;

/**
 * Meta tag selector for workspace ID
 */
export const META_SELECTORS = {
  WORKSPACE: 'meta[name="userplane:workspace"]',
} as const;
