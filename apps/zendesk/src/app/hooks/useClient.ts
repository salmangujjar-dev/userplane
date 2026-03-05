import { useContext } from 'react';

import { ClientContext } from '@/app/contexts/ClientProvider';

export function useClient(): ZAFClientInstance {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return client;
}
