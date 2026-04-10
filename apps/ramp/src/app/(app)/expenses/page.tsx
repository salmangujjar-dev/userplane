'use client';

import { PlusIcon, ReceiptTextIcon } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpensesTable } from '@/components/expenses/ExpensesTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { toastManager } from '@/components/ui/toast';
import { useExpenses } from '@/hooks/useExpenses';
import { api } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import type { ExpenseWithRelations } from '@/lib/data/types';
import { getActiveFailureFlags, isFailureActive } from '@/lib/feature-flags';

type SortField = 'date' | 'amount' | 'employee' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

// URL search param parsers -- all filter state lives in the URL
const filterParsers = {
  status: parseAsString.withDefault('all'),
  categoryId: parseAsString.withDefault('all'),
  employeeId: parseAsString.withDefault('all'),
  search: parseAsString.withDefault(''),
  sortField: parseAsString.withDefault('date'),
  sortDir: parseAsString.withDefault('desc'),
  page: parseAsInteger.withDefault(0),
};

// Suspense boundary required because useQueryStates (nuqs) calls
// useSearchParams internally, which Next.js cannot resolve at
// static prerender time without one.
export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}

function ExpensesContent() {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search: when searchDebounce is enabled, delay search by 300ms
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      if (isFailureActive('searchDebounce')) {
        // Sabotage: fire immediately on every keystroke — no debounce
        setFilters({ search: value, page: 0 });
        return;
      }

      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFilters({ search: value, page: 0 });
      }, SEARCH_DEBOUNCE_MS);
    },
    [setFilters]
  );

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (filters.status !== 'all') p.status = filters.status;
    if (filters.categoryId !== 'all') p.categoryId = filters.categoryId;
    if (filters.employeeId !== 'all') p.employeeId = filters.employeeId;
    if (filters.search) p.search = filters.search;
    p.sortField = filters.sortField;
    p.sortDir = filters.sortDir;
    p.page = String(filters.page);
    p.pageSize = String(PAGE_SIZE);
    return p;
  }, [filters]);

  const { expenses, total, isLoading, mutate } = useExpenses(params);

  useEffect(() => {
    const activeFlags = getActiveFailureFlags();
    log.debug({ activeFlags }, 'ExpensesPage mounted');
  }, []);

  useEffect(() => {
    if (!isLoading) log.debug({ count: expenses.length, total }, 'ExpensesPage data ready');
  }, [expenses, total, isLoading]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (filters.sortField === field) {
      setFilters({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc', page: 0 });
    } else {
      setFilters({ sortField: field, sortDir: 'asc', page: 0 });
    }
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    log.debug('expense create started');
    setIsSubmitting(true);
    try {
      await api.expenses.create(data);
      await mutate();
      setCreateOpen(false);
      log.debug('expense created successfully');
      toastManager.add({ title: 'Expense created', type: 'success' });
    } catch (err) {
      log.error({ err }, 'expense create failed');
      toastManager.add({
        title: 'Failed to create expense',
        description:
          err instanceof Error ? err.message : 'Something went wrong. Please try again later.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editExpense) return;
    log.debug({ expenseId: editExpense.id }, 'expense edit started');
    setIsSubmitting(true);
    try {
      await api.expenses.update(editExpense.id, data);
      await mutate();
      setEditExpense(null);
      log.debug({ expenseId: editExpense.id }, 'expense edited successfully');
      toastManager.add({ title: 'Expense updated', type: 'success' });
    } catch (err) {
      log.error({ expenseId: editExpense.id, err }, 'expense edit failed');
      toastManager.add({
        title: 'Failed to update expense',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    log.debug({ expenseId: id }, 'expense approve started');
    try {
      await api.expenses.approve(id);
      await mutate();
      log.debug({ expenseId: id }, 'expense approved');
      toastManager.add({ title: 'Expense approved', type: 'success' });
    } catch (err) {
      log.error({ expenseId: id, err }, 'expense approve failed');
      toastManager.add({
        title: 'Failed to approve expense',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        type: 'error',
      });
    }
  };

  const handleReject = async (id: string) => {
    log.debug({ expenseId: id }, 'expense reject started');
    try {
      await api.expenses.reject(id);
      await mutate();
      log.debug({ expenseId: id }, 'expense rejected');
      toastManager.add({ title: 'Expense rejected', type: 'success' });
    } catch (err) {
      log.error({ expenseId: id, err }, 'expense reject failed');
      toastManager.add({
        title: 'Failed to reject expense',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        type: 'error',
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ExpenseFilters
          status={filters.status}
          categoryId={filters.categoryId}
          employeeId={filters.employeeId}
          search={filters.search}
          onStatusChange={(v) => setFilters({ status: v, page: 0 })}
          onCategoryChange={(v) => setFilters({ categoryId: v, page: 0 })}
          onEmployeeChange={(v) => setFilters({ employeeId: v, page: 0 })}
          onSearchChange={handleSearchChange}
        />
        <Button
          onClick={() => {
            if (isFailureActive('newExpenseButton')) {
              console.error('[Expenses] New expense action is temporarily unavailable');
              toastManager.add({
                title: 'Unable to create expense',
                description: 'This action is temporarily unavailable. Please try again later.',
                type: 'error',
              });
              return;
            }
            setCreateOpen(true);
          }}
          className="shrink-0"
        >
          <PlusIcon /> New Expense
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No expenses found</EmptyTitle>
            <EmptyDescription>
              {filters.search ||
              filters.status !== 'all' ||
              filters.categoryId !== 'all' ||
              filters.employeeId !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first expense to get started.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ErrorBoundary>
          <ExpensesTable
            expenses={expenses}
            sortField={filters.sortField as SortField}
            sortDir={filters.sortDir as SortDirection}
            page={filters.page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            onSort={handleSort}
            onPageChange={(p) => setFilters({ page: p })}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={setEditExpense}
          />
        </ErrorBoundary>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>New Expense</DialogTitle>
            <DialogDescription>Submit a new expense for approval.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <ExpenseForm
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogPanel>
        </DialogPopup>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <ExpenseForm
              expense={editExpense}
              onSubmit={handleEdit}
              onCancel={() => setEditExpense(null)}
              isSubmitting={isSubmitting}
            />
          </DialogPanel>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
