'use client';

/**
 * Zendesk session management hook
 * Uses ZAF JWT to establish a short-lived session for ORPC calls.
 *
 * Flow:
 * 1. Calls POST /api/v1/zendesk/session via ZAF client.request() with JWT signing
 * 2. ZAF proxy signs the request with the jwt_secret secure setting (never in browser)
 * 3. API verifies the ZAF JWT and returns a short-lived session JWT (15 min)
 * 4. Session JWT is used for subsequent ORPC calls
 * 5. Auto-refreshes before expiry (every 12 min)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { useZendeskClient } from './use-client';

/** Refresh 3 minutes before the 15-minute session expires */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

interface UseZendeskSessionReturn {
  sessionToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useZendeskSession(
  apiUrl: string,
  workspaceId: string,
  subdomain: string
): UseZendeskSessionReturn {
  const zafClient = useZendeskClient();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const response = await zafClient.request<{ token: string }>({
        url: `${apiUrl}/api/v1/zendesk/session`,
        type: 'POST',
        contentType: 'application/json',
        secure: true,
        headers: {
          Authorization: 'Bearer {{jwt.token}}',
        },
        jwt: {
          algorithm: 'HS256',
          secret_key: '{{setting.jwt_secret}}',
          expiry: 300,
          claims: { ws_id: workspaceId, subdomain },
        },
      });

      setSessionToken(response.token);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to establish session';
      setError(message);
      setSessionToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [zafClient, apiUrl, workspaceId, subdomain]);

  useEffect(() => {
    if (!workspaceId || !subdomain) return;

    void (async () => {
      // Yield first so fetchSession's state updates land in an async
      // continuation instead of synchronously during the effect.
      await Promise.resolve();
      await fetchSession();
    })();

    refreshTimerRef.current = setInterval(fetchSession, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchSession, workspaceId, subdomain]);

  // Nothing to load until Zendesk has told us which workspace/subdomain we're in.
  const isConfigured = Boolean(workspaceId && subdomain);

  return { sessionToken, isLoading: isConfigured && isLoading, error };
}
