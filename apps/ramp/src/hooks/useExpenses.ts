import useSWR from 'swr';

import { fetcher } from '@/lib/api/client';
import type { ExpenseWithRelations } from '@/lib/data/types';

interface ExpensesResponse {
  data: ExpenseWithRelations[];
  total: number;
}

const expensesFetcher = (url: string): Promise<ExpensesResponse> =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (!json.success) throw new Error(json.error);
      return { data: json.data, total: json.total };
    });

export function useExpenses(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const { data, error, isLoading, mutate } = useSWR<ExpensesResponse>(
    `/api/expenses${query}`,
    expensesFetcher
  );

  return {
    expenses: data?.data ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  };
}

export function useExpense(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ExpenseWithRelations>(
    id ? `/api/expenses/${id}` : null,
    fetcher
  );

  return { expense: data ?? null, error, isLoading, mutate };
}
