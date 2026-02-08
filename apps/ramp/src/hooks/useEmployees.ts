import useSWR from 'swr';

import { fetcher } from '@/lib/api/client';
import type { Employee } from '@/lib/data/types';

export function useEmployees() {
  const { data, error, isLoading } = useSWR<Employee[]>('/api/employees', fetcher);
  return { employees: data ?? [], error, isLoading };
}
