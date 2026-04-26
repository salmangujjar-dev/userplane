'use client';

import { CheckIcon, ClipboardCheckIcon, ClockIcon, EyeIcon, SearchIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

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
import { useExpenses } from '@/hooks/useExpenses';
import { api } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import { deriveApprovalQueue, type RiskLevel } from '@/lib/data/mock-finance';
import { isFailureActive } from '@/lib/feature-flags';
import { formatCurrency, formatDate } from '@/lib/utils';

const riskLabels: Record<string, string> = {
  all: 'All Risk',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export default function ApprovalsPage() {
  const { expenses, total, isLoading, mutate } = useExpenses({
    status: 'pending',
    sortField: 'date',
    sortDir: 'desc',
  });
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('all');
  const [department, setDepartment] = useState('all');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const queue = useMemo(() => deriveApprovalQueue(expenses), [expenses]);
  const departments = useMemo(() => {
    return Array.from(
      new Set(
        queue.flatMap((item) =>
          item.expense.employee?.department ? [item.expense.employee.department] : []
        )
      )
    ).sort();
  }, [queue]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return queue.filter((item) => {
      const expense = item.expense;
      const searchMatches =
        !query ||
        expense.merchant.toLowerCase().includes(query) ||
        expense.description.toLowerCase().includes(query) ||
        expense.employee?.name.toLowerCase().includes(query) ||
        expense.category?.name.toLowerCase().includes(query);
      const riskMatches = risk === 'all' || item.riskLevel === risk;
      const departmentMatches = department === 'all' || expense.employee?.department === department;

      return searchMatches && riskMatches && departmentMatches;
    });
  }, [department, queue, risk, search]);

  const highRiskCount = queue.filter((item) => item.riskLevel === 'high').length;
  const agingCount = queue.filter((item) => item.submittedAgeDays >= 7).length;
  const pendingAmount = queue.reduce((sum, item) => sum + item.expense.amount, 0);

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
        <SummaryTile label="Pending amount" value={formatCurrency(pendingAmount)} />
        <SummaryTile label="High-risk items" value={highRiskCount.toString()} />
        <SummaryTile label="Aging over 7d" value={agingCount.toString()} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search approvals..."
              value={search}
              onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
              className="pl-9"
            />
          </div>
          <Select value={risk} onValueChange={(value) => setRisk(value as string)}>
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
          <Select value={department} onValueChange={(value) => setDepartment(value as string)}>
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
          Showing {filtered.length} of {total}
        </p>
      </div>

      {isFailureActive('approvalsQueueRender') ? (
        <ErrorBoundary>
          <ApprovalsChaosFailure />
        </ErrorBoundary>
      ) : filtered.length === 0 ? (
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
              {filtered.map((item) => {
                const expense = item.expense;
                const approving = activeAction === `approve:${expense.id}`;
                const rejecting = activeAction === `reject:${expense.id}`;

                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {expense.merchant}
                        </Link>
                        <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {expense.description} · {formatDate(expense.date)}
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
    </div>
  );
}

function ApprovalsChaosFailure(): never {
  throw new Error('Approval queue renderer failed while reconciling pending expenses.');
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
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
