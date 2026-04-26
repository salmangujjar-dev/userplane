import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { VendorWithCategory } from '@/lib/data/types';

export function useVendors() {
  const { data, error, isLoading } = useSWR<VendorWithCategory[]>('/api/vendors', fetcher);

  useEffect(() => {
    if (data) log.debug({ count: data.length }, 'useVendors loaded');
    if (error) {
      log.error({ err: error }, 'useVendors error');
      toastManager.add({
        title: 'Failed to load vendors',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

  return { vendors: data ?? [], error, isLoading };
}
