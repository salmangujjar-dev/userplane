import useSWR from 'swr';

import { fetcher } from '@/lib/api/client';
import type { Category } from '@/lib/data/types';

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>('/api/categories', fetcher);
  return { categories: data ?? [], error, isLoading };
}
