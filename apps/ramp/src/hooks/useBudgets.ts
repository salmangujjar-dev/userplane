import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { DepartmentBudget } from '@/lib/data/types';

export function useBudgets() {
  const { data, error, isLoading } = useSWR<DepartmentBudget[]>('/api/budgets', fetcher);

  useEffect(() => {
    if (data) log.debug({ count: data.length }, 'useBudgets loaded');
    if (error) {
      log.error({ err: error }, 'useBudgets error');
      toastManager.add({
        title: 'Failed to load budgets',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

  return { budgets: data ?? [], error, isLoading };
}
