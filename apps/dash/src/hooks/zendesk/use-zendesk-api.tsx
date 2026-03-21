'use client';

/**
 * Zendesk ORPC API client provider
 * Creates a type-safe ORPC client authenticated with a short-lived session JWT
 */

import type { SafeClient, UserplaneClient } from '@userplane/client';
import { createClient, createSafeClient } from '@userplane/client';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

type ZendeskApiClient = SafeClient<UserplaneClient>;

const ZendeskApiContext = createContext<ZendeskApiClient | null>(null);

interface ZendeskApiProviderProps {
  sessionToken: string;
  apiUrl: string;
  children: ReactNode;
}

export function ZendeskApiProvider({ sessionToken, apiUrl, children }: ZendeskApiProviderProps) {
  // Use a ref to always provide the latest token without recreating the client
  const tokenRef = useRef(sessionToken);

  useEffect(() => {
    tokenRef.current = sessionToken;
  }, [sessionToken]);

  const client = useMemo(
    () =>
      createSafeClient(
        createClient({
          url: `${apiUrl}/api/v1`,
          credentials: 'omit',
          headers: () => ({ Authorization: `Bearer ${tokenRef.current}` }),
        })
      ),
    // Only recreate client when apiUrl changes, not on every token refresh
    // Token updates are handled via the ref

    [apiUrl]
  );

  return <ZendeskApiContext.Provider value={client}>{children}</ZendeskApiContext.Provider>;
}

export function useZendeskApi(): ZendeskApiClient {
  const client = useContext(ZendeskApiContext);
  if (!client) {
    throw new Error('useZendeskApi must be used within a ZendeskApiProvider');
  }
  return client;
}
