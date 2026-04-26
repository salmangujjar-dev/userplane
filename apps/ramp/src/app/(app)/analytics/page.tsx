'use client';

import {
  BarChart3Icon,
  Building2Icon,
  CheckCircleIcon,
  ClockIcon,
  GaugeIcon,
  ReceiptTextIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { CategoryBreakdown } from '@/components/analytics/CategoryBreakdown';
import { MetricCard } from '@/components/analytics/MetricCard';
import { SpendingChart } from '@/components/analytics/SpendingChart';
import { TopSpendersCard } from '@/components/analytics/TopSpendersCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { toastManager } from '@/components/ui/toast';
import { useBudgets } from '@/hooks/useBudgets';
import { useCards } from '@/hooks/useCards';
import { useCategories } from '@/hooks/useCategories';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { useVendors } from '@/hooks/useVendors';
import { log } from '@/lib/client-logger';
import {
  deriveBudgetSummaries,
  deriveCardSummaries,
  deriveVendorSummaries,
  getCategorySpend,
} from '@/lib/data/mock-finance';
import { getActiveFailureFlags, isFailureActive } from '@/lib/feature-flags';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { cards, isLoading: cardsLoading } = useCards();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const [trendPeriod, setTrendPeriod] = useState<string | number>('90');
  const isLoading =
    expensesLoading ||
    employeesLoading ||
    categoriesLoading ||
    cardsLoading ||
    vendorsLoading ||
    budgetsLoading;

  useEffect(() => {
    const activeFlags = getActiveFailureFlags();
    log.debug({ activeFlags }, 'AnalyticsPage mounted');
  }, []);

  useEffect(() => {
    if (!isLoading) log.debug({ expenseCount: expenses.length }, 'AnalyticsPage data ready');
  }, [expenses.length, isLoading]);

  const analytics = useMemo(() => {
    const approved = expenses.filter((expense) => expense.status === 'approved');
    const pending = expenses.filter((expense) => expense.status === 'pending');
    const receiptCount = expenses.filter((expense) => Boolean(expense.receiptUrl)).length;
    const totalSpend = approved.reduce((sum, expense) => sum + expense.amount, 0);
    const avgExpense = approved.length > 0 ? totalSpend / approved.length : 0;
    const approvalRate = expenses.length > 0 ? (approved.length / expenses.length) * 100 : 0;
    const receiptCoverage = expenses.length > 0 ? (receiptCount / expenses.length) * 100 : 0;
    const budgetSummaries = deriveBudgetSummaries(budgets, employees, expenses);
    const vendorSummaries = deriveVendorSummaries(vendors, expenses);
    const cardSummaries = deriveCardSummaries(cards, expenses);
    const categorySpend = getCategorySpend(categories, expenses);

    return {
      totalSpend,
      avgExpense,
      pendingCount: pending.length,
      approvalRate,
      receiptCoverage,
      budgets: budgetSummaries,
      vendors: vendorSummaries,
      cards: cardSummaries,
      categorySpend,
    };
  }, [budgets, cards, categories, employees, expenses, vendors]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const topBudgets = analytics.budgets
    .slice()
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 6);
  const topVendors = analytics.vendors.slice(0, 6);
  const cardReviewCount = analytics.cards.filter((card) => card.status !== 'active').length;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Approved spend"
          value={formatCurrency(analytics.totalSpend)}
          trend={{ value: `${analytics.vendors.length} vendors`, positive: true }}
          icon={<BarChart3Icon className="size-4" />}
          valueClassName="financial-amount"
        />
        <MetricCard
          title="Average expense"
          value={formatCurrency(analytics.avgExpense)}
          icon={<ReceiptTextIcon className="size-4" />}
          valueClassName="financial-amount"
        />
        <MetricCard
          title="Pending expenses"
          value={analytics.pendingCount.toString()}
          trend={{ value: `${cardReviewCount} card reviews`, positive: cardReviewCount === 0 }}
          icon={<ClockIcon className="size-4" />}
        />
        <MetricCard
          title="Approval rate"
          value={`${analytics.approvalRate.toFixed(1)}%`}
          trend={{
            value: `${analytics.receiptCoverage.toFixed(1)}% receipt coverage`,
            positive: true,
          }}
          icon={<CheckCircleIcon className="size-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm">Spending trends</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Approved expense volume</p>
              </div>
              <Tabs
                value={trendPeriod}
                onValueChange={(value) => {
                  if (isFailureActive('spendingTrendTabs')) {
                    console.error(
                      '[Analytics] Spending trend controls are temporarily unavailable'
                    );
                    toastManager.add({
                      title: 'Unable to change time period',
                      description:
                        'Spending trend controls are temporarily unavailable. Please try again later.',
                      type: 'error',
                    });
                    return;
                  }
                  setTrendPeriod(value);
                }}
              >
                <TabsList>
                  <TabsTab value="30">30d</TabsTab>
                  <TabsTab value="90">90d</TabsTab>
                  <TabsTab value="365">1y</TabsTab>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardPanel className="p-4">
            <Tabs value={trendPeriod} onValueChange={setTrendPeriod}>
              <TabsPanel value="30">
                <ErrorBoundary>
                  <SpendingChart expenses={expenses} days={30} />
                </ErrorBoundary>
              </TabsPanel>
              <TabsPanel value="90">
                <ErrorBoundary>
                  <SpendingChart expenses={expenses} days={90} />
                </ErrorBoundary>
              </TabsPanel>
              <TabsPanel value="365">
                <ErrorBoundary>
                  <SpendingChart expenses={expenses} days={365} />
                </ErrorBoundary>
              </TabsPanel>
            </Tabs>
          </CardPanel>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <GaugeIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Budget utilization</CardTitle>
            </div>
          </CardHeader>
          <CardPanel className="space-y-3 p-4">
            <ErrorBoundary>
              {isFailureActive('analyticsOpsPanelsRender') ? (
                <AnalyticsOpsChaosFailure />
              ) : (
                topBudgets.map((budget) => (
                  <div key={budget.department} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{budget.department}</p>
                        <p className="financial-amount text-xs text-muted-foreground">
                          {formatCurrency(budget.approvedSpend + budget.pendingSpend)} of{' '}
                          {formatCurrency(budget.monthlyBudget)}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        variant={
                          budget.status === 'over'
                            ? 'error'
                            : budget.status === 'watch'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {budget.utilization}%
                      </Badge>
                    </div>
                    <ProgressBar value={budget.utilization} />
                  </div>
                ))
              )}
            </ErrorBoundary>
          </CardPanel>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 overflow-hidden rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-sm">Category breakdown</CardTitle>
          </CardHeader>
          <CardPanel className="p-4">
            <ErrorBoundary>
              <CategoryBreakdown expenses={expenses} />
            </ErrorBoundary>
          </CardPanel>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Vendor concentration</CardTitle>
            </div>
          </CardHeader>
          <CardPanel className="space-y-3 p-4">
            <ErrorBoundary>
              {isFailureActive('analyticsOpsPanelsRender') ? (
                <AnalyticsOpsChaosFailure />
              ) : (
                topVendors.map((vendor) => (
                  <div key={vendor.merchant} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="vendor-name truncate font-medium">{vendor.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.categoryName} · {vendor.transactionCount} charges
                        </p>
                      </div>
                      <p className="financial-amount font-medium tabular-nums">
                        {formatCurrency(vendor.totalSpend)}
                      </p>
                    </div>
                    <ProgressBar
                      value={
                        topVendors[0]?.totalSpend
                          ? (vendor.totalSpend / topVendors[0].totalSpend) * 100
                          : 0
                      }
                    />
                  </div>
                ))
              )}
            </ErrorBoundary>
          </CardPanel>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-sm">Category ledger</CardTitle>
          </CardHeader>
          <CardPanel className="space-y-3 p-4">
            {analytics.categorySpend.slice(0, 6).map((item) => (
              <div key={item.category.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.category.name}</p>
                  <p className="text-xs text-muted-foreground">{item.count} approved expenses</p>
                </div>
                <p className="financial-amount text-sm font-medium tabular-nums">
                  {formatCurrency(item.spend)}
                </p>
              </div>
            ))}
          </CardPanel>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-sm">Top spenders</CardTitle>
          </CardHeader>
          <CardPanel className="p-4">
            <ErrorBoundary>
              <TopSpendersCard expenses={expenses} />
            </ErrorBoundary>
          </CardPanel>
        </Card>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function AnalyticsOpsChaosFailure(): never {
  throw new Error('Analytics operations panels failed to merge budgets and vendor signals.');
}
