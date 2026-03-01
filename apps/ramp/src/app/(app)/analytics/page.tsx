'use client';

import { CheckCircleIcon, ClockIcon, DollarSignIcon, ReceiptTextIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { CategoryBreakdown } from '@/components/analytics/CategoryBreakdown';
import { MetricCard } from '@/components/analytics/MetricCard';
import { SpendingChart } from '@/components/analytics/SpendingChart';
import { TopSpendersCard } from '@/components/analytics/TopSpendersCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { toastManager } from '@/components/ui/toast';
import { useExpenses } from '@/hooks/useExpenses';
import { log } from '@/lib/client-logger';
import { getActiveFailureFlags, isFeatureEnabled } from '@/lib/feature-flags';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { expenses, isLoading } = useExpenses();
  const [trendPeriod, setTrendPeriod] = useState<string | number>('90');

  useEffect(() => {
    const activeFlags = getActiveFailureFlags();
    log.debug({ activeFlags }, 'AnalyticsPage mounted');
  }, []);

  useEffect(() => {
    if (!isLoading) log.debug({ expenseCount: expenses.length }, 'AnalyticsPage data ready');
  }, [expenses, isLoading]);

  const metrics = useMemo(() => {
    const approved = expenses.filter((e) => e.status === 'approved');
    const pending = expenses.filter((e) => e.status === 'pending');
    const totalSpend = approved.reduce((sum, e) => sum + e.amount, 0);
    const avgExpense = approved.length > 0 ? totalSpend / approved.length : 0;
    const approvalRate = expenses.length > 0 ? (approved.length / expenses.length) * 100 : 0;

    return {
      totalSpend: formatCurrency(totalSpend),
      avgExpense: formatCurrency(avgExpense),
      pendingCount: pending.length.toString(),
      approvalRate: `${approvalRate.toFixed(1)}%`,
    };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={metrics.totalSpend}
          trend={{ value: 'vs last period', positive: true }}
          icon={<DollarSignIcon className="size-4" />}
        />
        <MetricCard
          title="Average Expense"
          value={metrics.avgExpense}
          icon={<ReceiptTextIcon className="size-4" />}
        />
        <MetricCard
          title="Pending Expenses"
          value={metrics.pendingCount}
          icon={<ClockIcon className="size-4" />}
        />
        <MetricCard
          title="Approval Rate"
          value={metrics.approvalRate}
          trend={{ value: 'of all expenses', positive: true }}
          icon={<CheckCircleIcon className="size-4" />}
        />
      </div>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
        </CardHeader>
        <CardPanel>
          <Tabs
            value={trendPeriod}
            onValueChange={(val) => {
              if (!isFeatureEnabled('spendingTrendTabs')) {
                console.error('[Analytics] Spending trend controls are temporarily unavailable');
                toastManager.add({
                  title: 'Unable to change time period',
                  description:
                    'Spending trend controls are temporarily unavailable. Please try again later.',
                  type: 'error',
                });
                return;
              }
              setTrendPeriod(val);
            }}
          >
            <TabsList>
              <TabsTab value="30">30 Days</TabsTab>
              <TabsTab value="90">90 Days</TabsTab>
              <TabsTab value="365">1 Year</TabsTab>
            </TabsList>
            <TabsPanel value="30" className="pt-4">
              <ErrorBoundary>
                <SpendingChart expenses={expenses} days={30} />
              </ErrorBoundary>
            </TabsPanel>
            <TabsPanel value="90" className="pt-4">
              <ErrorBoundary>
                <SpendingChart expenses={expenses} days={90} />
              </ErrorBoundary>
            </TabsPanel>
            <TabsPanel value="365" className="pt-4">
              <ErrorBoundary>
                <SpendingChart expenses={expenses} days={365} />
              </ErrorBoundary>
            </TabsPanel>
          </Tabs>
        </CardPanel>
      </Card>

      {/* Category Breakdown */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardPanel>
          <ErrorBoundary>
            <CategoryBreakdown expenses={expenses} />
          </ErrorBoundary>
        </CardPanel>
      </Card>

      {/* Top Spenders */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Top Spenders</CardTitle>
        </CardHeader>
        <CardPanel>
          <ErrorBoundary>
            <TopSpendersCard expenses={expenses} />
          </ErrorBoundary>
        </CardPanel>
      </Card>
    </div>
  );
}
