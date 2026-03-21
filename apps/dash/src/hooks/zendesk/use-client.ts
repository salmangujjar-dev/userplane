import { useContext } from 'react';

import { ClientContext } from '@/components/zendesk/ClientProvider';
import type { ZAFClientInstance } from '@/lib/zendesk/types';

export function useZendeskClient(): ZAFClientInstance {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error('useZendeskClient must be used within a ClientProvider');
  }
  return client;
}
