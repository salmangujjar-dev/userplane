import { createClient, safe } from '@workspace/client';

import { env } from '@/env';
import { handleSafeResult } from '@/lib/errors';

/**
 * Public API client — no auth cookies, no 401 redirect.
 * Used for public endpoints like shared recording viewing.
 */
const publicClient = createClient({
  url: `${env.api.url}/api/v1`,
  credentials: 'omit',
});

/**
 * Fetch a shared recording using a public share token.
 * Uses the oRPC contract for type safety and response validation.
 */
export async function fetchSharedRecording(token: string) {
  const [error, result] = await safe(publicClient.share.view({ query: { token } }));
  return handleSafeResult(error, result?.data ?? null);
}
