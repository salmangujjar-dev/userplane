/**
 * ClientProvider - ZAF SDK client provider following Zendesk scaffold pattern
 * Initializes ZAFClient and waits for app.registered event before rendering children
 */

import { createContext, type ReactNode, useEffect, useState } from 'react';

export const ClientContext = createContext<ZAFClientInstance | null>(null);

interface ClientProviderProps {
  children: ReactNode;
}

const REGISTRATION_TIMEOUT_MS = 10_000;

export function ClientProvider({ children }: ClientProviderProps) {
  const [client, setClient] = useState<ZAFClientInstance | null>(null);
  const [appRegistered, setAppRegistered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (typeof window.ZAFClient === 'undefined') {
      setTimedOut(true);
      return;
    }

    const zafClient = window.ZAFClient.init();

    zafClient.on('app.registered', () => {
      setClient(zafClient);
      setAppRegistered(true);
    });

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, REGISTRATION_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (timedOut && !appRegistered) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#cc3340' }}>
        <p style={{ fontWeight: 600 }}>Failed to connect to Zendesk</p>
        <p style={{ fontSize: '13px', color: '#68737d' }}>
          This app must be loaded inside Zendesk. Please reload the page or contact support.
        </p>
      </div>
    );
  }

  if (!appRegistered || !client) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}
