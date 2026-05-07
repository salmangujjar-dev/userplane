import { useEffect } from 'react';
import useSWR from 'swr';

import { toastManager } from '@/components/ui/toast';
import { fetcher } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type {
  AnalyticsSummary,
  ApprovalSummary,
  CardDirectorySummary,
  DashboardSummary,
  EmployeeDirectorySummary,
  VendorDirectorySummary,
} from '@/lib/data/summary-types';

type SummaryParams = Record<string, string | undefined>;

function summaryUrl(path: string, params?: SummaryParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function useSummary<T>(url: string, label: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher);

  useEffect(() => {
    if (data) log.debug({ url }, `${label} loaded`);
    if (error) {
      log.error({ err: error, url }, `${label} error`);
      toastManager.add({
        title: `Failed to load ${label}`,
        description: error instanceof Error ? error.message : 'Please try again later.',
        type: 'error',
      });
    }
  }, [data, error, label, url]);

  return { data, error, isLoading, mutate };
}

export function useDashboardSummary() {
  return useSummary<DashboardSummary>('/api/summaries/dashboard', 'dashboard summary');
}

export function useAnalyticsSummary() {
  return useSummary<AnalyticsSummary>('/api/summaries/analytics', 'analytics summary');
}

export function useApprovalSummary(params?: SummaryParams) {
  return useSummary<ApprovalSummary>(
    summaryUrl('/api/summaries/approvals', params),
    'approval summary'
  );
}

export function useCardDirectorySummary(params?: SummaryParams) {
  return useSummary<CardDirectorySummary>(
    summaryUrl('/api/summaries/cards', params),
    'card summary'
  );
}

export function useVendorDirectorySummary(params?: SummaryParams) {
  return useSummary<VendorDirectorySummary>(
    summaryUrl('/api/summaries/vendors', params),
    'vendor summary'
  );
}

export function useEmployeeDirectorySummary(params?: SummaryParams) {
  return useSummary<EmployeeDirectorySummary>(
    summaryUrl('/api/summaries/employees', params),
    'employee summary'
  );
}
