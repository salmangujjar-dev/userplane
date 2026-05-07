'use client';

import { CheckIcon, ClipboardCheckIcon, ClockIcon, EyeIcon, SearchIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExpenseStatusBadge } from '@/components/expenses/ExpenseStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toastManager } from '@/components/ui/toast';
import { useApprovalSummary } from '@/hooks/useFinanceSummaries';
import { api } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { RiskLevel } from '@/lib/data/mock-finance';
import { isFailureActive } from '@/lib/feature-flags';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const PAGE_SIZE = 25;

const riskLabels: Record<string, string> = {
  all: 'All Risk',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export default function ApprovalsPage() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('all');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(0);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const { data, isLoading, mutate } = useApprovalSummary({
    search,
    risk: risk === 'all' ? undefined : risk,
    department: department === 'all' ? undefined : department,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const approvals = data?.approvals ?? [];
  const departments = data?.departments ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, total);

  const setSearchFilter = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const setRiskFilter = (value: string) => {
    setRisk(value);
    setPage(0);
  };

  const setDepartmentFilter = (value: string) => {
    setDepartment(value);
    setPage(0);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (isFailureActive('approvalsActionButtons')) {
      console.error('[Approvals] Action buttons are temporarily unavailable');
      toastManager.add({
        title: 'Approval action stalled',
        description: 'The approval workflow is temporarily unavailable. Please retry later.',
        type: 'error',
      });
      return;
    }

    setActiveAction(`${action}:${id}`);
    log.debug({ expenseId: id, action }, 'approval action started');

    try {
      if (action === 'approve') {
        await api.expenses.approve(id);
      } else {
        await api.expenses.reject(id);
      }
      await mutate();
      toastManager.add({
        title: action === 'approve' ? 'Expense approved' : 'Expense rejected',
        type: 'success',
      });
    } catch (error) {
      log.error({ expenseId: id, action, err: error }, 'approval action failed');
      toastManager.add({
        title: action === 'approve' ? 'Failed to approve expense' : 'Failed to reject expense',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setActiveAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Pending amount"
          value={formatCurrency(data?.totals.pendingAmount ?? 0)}
          valueClassName="financial-amount"
        />
        <SummaryTile label="High-risk items" value={(data?.totals.highRiskCount ?? 0).toString()} />
        <SummaryTile label="Aging over 7d" value={(data?.totals.agingCount ?? 0).toString()} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search approvals..."
              value={search}
              onChange={(event) => setSearchFilter((event.target as HTMLInputElement).value)}
              className="sensitive-form-field pl-9"
            />
          </div>
          <Select value={risk} onValueChange={(value) => setRiskFilter(value as string)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue>{() => riskLabels[risk] ?? 'All Risk'}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectPopup>
          </Select>
          <Select
            value={department}
            onValueChange={(value) => setDepartmentFilter(value as string)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue>
                {() => (department === 'all' ? 'All Departments' : department)}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {pageStart}-{pageEnd} of {total}
        </p>
      </div>

      {isFailureActive('approvalsQueueRender') ? (
        <ErrorBoundary>
          <ApprovalsChaosFailure />
        </ErrorBoundary>
      ) : approvals.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardCheckIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No approvals found</EmptyTitle>
            <EmptyDescription>Try adjusting the queue filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead className="hidden md:table-cell">Employee</TableHead>
                <TableHead className="hidden lg:table-cell">Policy</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((item) => {
                const expense = item.expense;
                const approving = activeAction === `approve:${expense.id}`;
                const rejecting = activeAction === `reject:${expense.id}`;

                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="merchant-name truncate font-medium hover:underline"
                        >
                          {expense.merchant}
                        </Link>
                        <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                          <span className="expense-description">{expense.description}</span> ·{' '}
                          <span className="sensitive-data">{formatDate(expense.date)}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="employee-name truncate font-medium">
                          {expense.employee?.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {expense.employee?.department}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <RiskBadge risk={item.riskLevel} />
                        <span className="text-sm text-muted-foreground">{item.policyNote}</span>
                      </div>
                    </TableCell>
                    <TableCell className="expense-amount text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ExpenseStatusBadge status={expense.status} />
                        <Badge variant="secondary" size="sm">
                          <ClockIcon /> {item.submittedAgeDays}d
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="View expense"
                          render={<Link href={`/expenses/${expense.id}`} />}
                        >
                          <EyeIcon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label="Approve expense"
                          disabled={Boolean(activeAction)}
                          onClick={() => handleAction(expense.id, 'approve')}
                        >
                          {approving ? <ClockIcon /> : <CheckIcon />}
                        </Button>
                        <Button
                          variant="destructive-outline"
                          size="icon-xs"
                          aria-label="Reject expense"
                          disabled={Boolean(activeAction)}
                          onClick={() => handleAction(expense.id, 'reject')}
                        >
                          {rejecting ? <ClockIcon /> : <XIcon />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalsChaosFailure(): never {
  throw new Error('Approval queue renderer failed while reconciling pending expenses.');
}

function SummaryTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', valueClassName)}>{value}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const variant = risk === 'high' ? 'warning' : risk === 'medium' ? 'info' : 'success';

  return (
    <Badge variant={variant} size="sm">
      {risk}
    </Badge>
  );
}
