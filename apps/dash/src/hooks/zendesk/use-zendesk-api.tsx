'use client';

/**
 * Zendesk ORPC API client provider
 * Creates a type-safe ORPC client authenticated with Bearer token
 * for the Zendesk iframe app
 */

import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { ClientContext, SafeClient, UserplaneClient } from '@userplane/client';
import { createClient, createSafeClient } from '@userplane/client';

type ZendeskApiClient = SafeClient<UserplaneClient>;

const ZendeskApiContext = createContext<ZendeskApiClient | null>(null);

interface ZendeskApiProviderProps {
  apiToken: string;
  apiUrl: string;
  children: ReactNode;
}

export function ZendeskApiProvider({ apiToken, apiUrl, children }: ZendeskApiProviderProps) {
  const client = useMemo(
    () =>
      createSafeClient(
        createClient({
          url: `${apiUrl}/api/v1`,
          credentials: 'omit',
          headers: { Authorization: `Bearer ${apiToken}` },
        })
      ),
    [apiToken, apiUrl]
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
