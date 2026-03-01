import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { Employee } from '@/lib/data/types';

export function useEmployees() {
  const { data, error, isLoading } = useSWR<Employee[]>('/api/employees', fetcher);

  useEffect(() => {
    if (data) log.debug({ count: data.length }, 'useEmployees loaded');
    if (error) {
      log.error({ err: error }, 'useEmployees error');
      toastManager.add({
        title: 'Failed to load employees',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

  return { employees: data ?? [], error, isLoading };
}
