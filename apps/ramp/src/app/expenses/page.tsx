'use client';

import { PlusIcon, ReceiptTextIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import type { ExpenseWithRelations } from '@/lib/data/types';

type SortField = 'date' | 'amount' | 'employee' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter !== 'all') p.status = statusFilter;
    if (categoryFilter !== 'all') p.categoryId = categoryFilter;
    if (search) p.search = search;
    p.sortField = sortField;
    p.sortDir = sortDir;
    p.page = String(page);
    p.pageSize = String(PAGE_SIZE);
    return p;
  }, [statusFilter, categoryFilter, search, sortField, sortDir, page]);

  const { expenses, total, isLoading, mutate } = useExpenses(params);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await api.expenses.create(data);
      await mutate();
      setCreateOpen(false);
      toastManager.add({ title: 'Expense created', type: 'success' });
    } catch {
      toastManager.add({ title: 'Failed to create expense', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editExpense) return;
    setIsSubmitting(true);
    try {
      await api.expenses.update(editExpense.id, data);
      await mutate();
      setEditExpense(null);
      toastManager.add({ title: 'Expense updated', type: 'success' });
    } catch {
      toastManager.add({ title: 'Failed to update expense', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.expenses.approve(id);
      await mutate();
      toastManager.add({ title: 'Expense approved', type: 'success' });
    } catch {
      toastManager.add({ title: 'Failed to approve expense', type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.expenses.reject(id);
      await mutate();
      toastManager.add({ title: 'Expense rejected', type: 'success' });
    } catch {
      toastManager.add({ title: 'Failed to reject expense', type: 'error' });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ExpenseFilters
          status={statusFilter}
          categoryId={categoryFilter}
          search={search}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
          onCategoryChange={(v) => {
            setCategoryFilter(v);
            setPage(0);
          }}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
        />
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
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
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first expense to get started.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ExpensesTable
          expenses={expenses}
          sortField={sortField}
          sortDir={sortDir}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onSort={handleSort}
          onPageChange={setPage}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={setEditExpense}
        />
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
