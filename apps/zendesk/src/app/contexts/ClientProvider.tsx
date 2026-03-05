/**
 * ClientProvider - ZAF SDK client provider following Zendesk scaffold pattern
 * Initializes ZAFClient and waits for app.registered event before rendering children
 */

import { createContext, type ReactNode, useEffect, useState } from 'react';

export const ClientContext = createContext<ZAFClientInstance | null>(null);

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [client, setClient] = useState<ZAFClientInstance | null>(null);
  const [appRegistered, setAppRegistered] = useState(false);

  useEffect(() => {
    const zafClient = window.ZAFClient.init();

    zafClient.on('app.registered', () => {
      setClient(zafClient);
      setAppRegistered(true);
    });
  }, []);

  if (!appRegistered || !client) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}
