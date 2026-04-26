'use client';

import {
  AlertTriangleIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { MetricCard } from '@/components/analytics/MetricCard';
import { SpendingChart } from '@/components/analytics/SpendingChart';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgets } from '@/hooks/useBudgets';
import { useCards } from '@/hooks/useCards';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { useVendors } from '@/hooks/useVendors';
import {
  deriveApprovalQueue,
  deriveBudgetSummaries,
  deriveCardSummaries,
  deriveDashboardMetrics,
  deriveVendorSummaries,
  getReceiptExceptions,
} from '@/lib/data/mock-finance';
import { isFailureActive } from '@/lib/feature-flags';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { cards, isLoading: cardsLoading } = useCards();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const isLoading =
    employeesLoading || expensesLoading || cardsLoading || vendorsLoading || budgetsLoading;

  const finance = useMemo(() => {
    const cardSummaries = deriveCardSummaries(cards, expenses);
    const vendorSummaries = deriveVendorSummaries(vendors, expenses);
    const budgetSummaries = deriveBudgetSummaries(budgets, employees, expenses);
    const metrics = deriveDashboardMetrics(
      expenses,
      cardSummaries,
      vendorSummaries,
      budgetSummaries
    );
    const approvals = deriveApprovalQueue(expenses);
    const receiptExceptions = getReceiptExceptions(expenses);

    return {
      cards: cardSummaries,
      vendors: vendorSummaries,
      budgets: budgetSummaries,
      metrics,
      approvals,
      receiptExceptions,
    };
  }, [budgets, cards, employees, expenses, vendors]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const topBudgets = finance.budgets
    .slice()
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);

  if (isFailureActive('dashboardSummaryRender')) {
    return (
      <div className="p-4 md:p-6">
        <ErrorBoundary>
          <DashboardChaosFailure />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="30-day spend"
          value={formatCurrency(finance.metrics.periodSpend)}
          trend={{ value: `${finance.metrics.budgetUtilization}% budget used`, positive: true }}
          icon={<DollarSignIcon className="size-4" />}
          valueClassName="financial-amount"
        />
        <MetricCard
          title="Awaiting approval"
          value={formatCurrency(finance.metrics.pendingSpend)}
          trend={{ value: `${finance.metrics.pendingCount} expenses`, positive: false }}
          icon={<ClockIcon className="size-4" />}
          valueClassName="financial-amount"
        />
        <MetricCard
          title="Active cards"
          value={finance.metrics.activeCards.toString()}
          trend={{ value: `${finance.cards.length} issued`, positive: true }}
          icon={<CreditCardIcon className="size-4" />}
        />
        <MetricCard
          title="Receipt coverage"
          value={`${finance.metrics.receiptCoverage}%`}
          trend={{ value: `${finance.metrics.approvalRate}% approval rate`, positive: true }}
          icon={<ReceiptTextIcon className="size-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Spend trend</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Approved spend over 30 days</p>
              </div>
              <Badge variant="secondary">Live mock</Badge>
            </div>
          </CardHeader>
          <CardPanel className="p-4">
            <ErrorBoundary>
              <SpendingChart expenses={expenses} days={30} />
            </ErrorBoundary>
          </CardPanel>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm">Approval queue</CardTitle>
              <Button size="xs" variant="outline" render={<Link href="/approvals" />}>
                Review <ArrowRightIcon />
              </Button>
            </div>
          </CardHeader>
          <CardPanel className="p-0">
            {finance.approvals.slice(0, 6).map((item) => (
              <Link
                key={item.expense.id}
                href={`/expenses/${item.expense.id}`}
                className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <ClockIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="merchant-name truncate text-sm font-medium">
                    {item.expense.merchant}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="employee-name">{item.expense.employee?.name}</span> ·{' '}
                    {item.policyNote}
                  </p>
                </div>
                <div className="text-right">
                  <p className="financial-amount text-sm font-medium tabular-nums">
                    {formatCurrency(item.expense.amount)}
                  </p>
                  <Badge size="sm" variant={item.riskLevel === 'high' ? 'warning' : 'secondary'}>
                    {item.submittedAgeDays}d
                  </Badge>
                </div>
              </Link>
            ))}
          </CardPanel>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Top vendors</CardTitle>
            </div>
          </CardHeader>
          <CardPanel className="space-y-3 p-4">
            {finance.vendors.slice(0, 5).map((vendor) => (
              <div key={vendor.merchant} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="vendor-name truncate text-sm font-medium">{vendor.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {vendor.transactionCount} transactions · {vendor.savingsOpportunity}
                  </p>
                </div>
                <p className="financial-amount text-sm font-medium tabular-nums">
                  {formatCurrency(vendor.totalSpend)}
                </p>
              </div>
            ))}
          </CardPanel>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Budget burn</CardTitle>
            </div>
          </CardHeader>
          <CardPanel className="space-y-4 p-4">
            {topBudgets.map((budget) => (
              <div key={budget.department} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{budget.department}</span>
                  <span className="text-muted-foreground tabular-nums">{budget.utilization}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, budget.utilization)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardPanel>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Attention</CardTitle>
            </div>
          </CardHeader>
          <CardPanel className="space-y-3 p-4">
            {finance.receiptExceptions.slice(0, 4).map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center justify-between gap-3 rounded-md p-1.5 hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="merchant-name truncate text-sm font-medium">{expense.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    Missing receipt ·{' '}
                    <span className="sensitive-data">{formatDate(expense.date)}</span>
                  </p>
                </div>
                <p className="financial-amount text-sm font-medium tabular-nums">
                  {formatCurrency(expense.amount)}
                </p>
              </Link>
            ))}
            {finance.receiptExceptions.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2Icon className="size-4" />
                No large receipt exceptions
              </div>
            )}
          </CardPanel>
        </Card>
      </div>
    </div>
  );
}

function DashboardChaosFailure(): never {
  throw new Error('Dashboard command center failed to hydrate spend intelligence.');
}
