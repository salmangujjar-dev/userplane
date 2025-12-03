import { getDashUrl } from './urls';

/**
 * Onboarding and signup flow URLs
 * All onboarding URLs point to the dashboard domain
 */

/**
 * Main signup page
 * Used for all signup, onboarding, and get-started flows
 */
export const SIGNUP_URL = getDashUrl('/auth');
