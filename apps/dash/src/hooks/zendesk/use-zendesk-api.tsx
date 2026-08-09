'use client';

/**
 * Zendesk ORPC API client provider
 * Creates a type-safe ORPC client authenticated with a short-lived session JWT
 */

import type { SafeClient, UserplaneClient } from '@userplane/client';
import { createClient, createSafeClient } from '@userplane/client';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

type ZendeskApiClient = SafeClient<UserplaneClient>;

const ZendeskApiContext = createContext<ZendeskApiClient | null>(null);

interface ZendeskApiProviderProps {
  sessionToken: string;
  apiUrl: string;
  children: ReactNode;
}

export function ZendeskApiProvider({ sessionToken, apiUrl, children }: ZendeskApiProviderProps) {
  // Rebuilt when the session token is refreshed rather than reading a ref during
  // render. createClient only assembles a config object, so this is cheap and the
  // token refreshes rarely.
  const client = useMemo(
    () =>
      createSafeClient(
        createClient({
          url: `${apiUrl}/api/v1`,
          credentials: 'omit',
          headers: () => ({ Authorization: `Bearer ${sessionToken}` }),
        })
      ),
    [apiUrl, sessionToken]
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
