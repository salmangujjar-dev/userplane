import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { ExpenseWithRelations } from '@/lib/data/types';

interface ExpensesResponse {
  data: ExpenseWithRelations[];
  total: number;
}

const expensesFetcher = async (url: string): Promise<ExpensesResponse> => {
  const res = await fetch(url);
  let json: { success?: boolean; error?: string; data?: ExpenseWithRelations[]; total?: number };

  try {
    json = await res.json();
  } catch {
    throw new Error(`Request failed with status ${res.status}`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }

  return { data: json.data ?? [], total: json.total ?? 0 };
};

export function useExpenses(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const { data, error, isLoading, mutate } = useSWR<ExpensesResponse>(
    `/api/expenses${query}`,
    expensesFetcher
  );

  useEffect(() => {
    if (data) log.debug({ count: data.data.length, total: data.total }, 'useExpenses loaded');
    if (error) {
      log.error({ err: error }, 'useExpenses error');
      toastManager.add({
        title: 'Failed to load expenses',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error]);

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

  useEffect(() => {
    if (data) log.debug({ expenseId: id }, 'useExpense loaded');
    if (error) {
      log.error({ expenseId: id, err: error }, 'useExpense error');
      toastManager.add({
        title: 'Failed to load expense',
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [id, data, error]);

  return { expense: data ?? null, error, isLoading, mutate };
}
