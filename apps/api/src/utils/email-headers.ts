/**
 * Email headers utility for preventing email threading
 *
 * Email clients thread messages based on:
 * 1. Same subject line
 * 2. Same sender
 * 3. References/In-Reply-To headers
 *
 * To prevent threading, we use the X-Entity-Ref-ID header with a unique value
 * for each email. This tells email clients that each message is standalone.
 */

import { randomUUID } from 'crypto';

/**
 * Generate anti-threading headers for emails
 *
 * Uses X-Entity-Ref-ID with a unique UUID to prevent email threading.
 * This ensures each email appears as a separate conversation even when
 * subjects are identical (e.g., "Verify your email", "Sign in to Userplane").
 *
 * @returns Headers object with X-Entity-Ref-ID set to a unique value
 */
export function antiThreadingHeaders(): Record<string, string> {
  return {
    'X-Entity-Ref-ID': randomUUID(),
  };
}
