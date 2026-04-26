import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { CorporateCardWithEmployee } from '@/lib/data/types';

export function useCards() {
  const { data, error, isLoading } = useSWR<CorporateCardWithEmployee[]>('/api/cards', fetcher);

  useEffect(() => {
    if (data) log.debug({ count: data.length }, 'useCards loaded');
    if (error) {
      log.error({ err: error }, 'useCards error');
      toastManager.add({
        title: 'Failed to load cards',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

  return { cards: data ?? [], error, isLoading };
}
