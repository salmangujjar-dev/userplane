import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { Category } from '@/lib/data/types';

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>('/api/categories', fetcher);

  useEffect(() => {
    if (data) log.debug({ count: data.length }, 'useCategories loaded');
    if (error) {
      log.error({ err: error }, 'useCategories error');
      toastManager.add({
        title: 'Failed to load categories',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

  return { categories: data ?? [], error, isLoading };
}
