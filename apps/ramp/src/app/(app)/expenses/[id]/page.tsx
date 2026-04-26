'use client';

import BoringAvatar from 'boring-avatars';
import { ArrowLeftIcon, CheckIcon, PencilIcon, ReceiptIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseStatusBadge } from '@/components/expenses/ExpenseStatusBadge';
import { ReceiptView } from '@/components/expenses/ReceiptView';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toastManager } from '@/components/ui/toast';
import { useExpense } from '@/hooks/useExpenses';
import { api } from '@/lib/api/client';
import { log } from '@/lib/client-logger';
import { getActiveFailureFlags, isFailureActive } from '@/lib/feature-flags';
import { formatCurrency, formatDate } from '@/lib/utils';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { expense, isLoading, mutate } = useExpense(id);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionsDisabled = isFailureActive('expenseDetailActions');

  useEffect(() => {
    const activeFlags = getActiveFailureFlags();
    log.debug({ expenseId: id, activeFlags }, 'ExpenseDetailPage mounted');
  }, [id]);

  useEffect(() => {
    if (expense) log.debug({ expenseId: id, status: expense.status }, 'ExpenseDetailPage loaded');
  }, [id, expense]);

  const handleAction = async () => {
    if (!confirmAction || !expense) return;
    log.debug({ expenseId: expense.id, action: confirmAction }, 'expense action started');
    setIsSubmitting(true);
    try {
      if (confirmAction === 'approve') {
        await api.expenses.approve(expense.id);
        toastManager.add({ title: 'Expense approved', type: 'success' });
      } else {
        await api.expenses.reject(expense.id);
        toastManager.add({ title: 'Expense rejected', type: 'success' });
      }
      await mutate();
      setConfirmAction(null);
      log.debug({ expenseId: expense.id, action: confirmAction }, 'expense action completed');
    } catch (err) {
      log.error({ expenseId: expense.id, action: confirmAction, err }, 'expense action failed');
      toastManager.add({
        title: `Failed to ${confirmAction} expense`,
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!expense) return;
    log.debug({ expenseId: expense.id }, 'expense detail edit started');
    setIsSubmitting(true);
    try {
      await api.expenses.update(expense.id, data);
      await mutate();
      setEditOpen(false);
      log.debug({ expenseId: expense.id }, 'expense detail edited');
      toastManager.add({ title: 'Expense updated', type: 'success' });
    } catch (err) {
      log.error({ expenseId: expense.id, err }, 'expense detail edit failed');
      toastManager.add({
        title: 'Failed to update expense',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Expense not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/expenses')}>
          <ArrowLeftIcon /> Back to Expenses
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/expenses')}>
          <ArrowLeftIcon /> Back
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="expense-amount text-3xl font-bold">{formatCurrency(expense.amount)}</h2>
            <ExpenseStatusBadge status={expense.status} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              disabled={actionsDisabled}
            >
              <PencilIcon /> Edit
            </Button>
            {expense.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction('approve')}
                  disabled={actionsDisabled}
                >
                  <CheckIcon /> Approve
                </Button>
                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => setConfirmAction('reject')}
                  disabled={actionsDisabled}
                >
                  <XIcon /> Reject
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardPanel>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground text-sm">Employee</dt>
                  <dd className="employee-name flex items-center gap-2 text-sm font-medium">
                    <BoringAvatar
                      size={20}
                      name={expense.employee?.name ?? '?'}
                      variant="beam"
                      colors={AVATAR_COLORS}
                    />
                    {expense.employee?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground text-sm">Category</dt>
                  <dd className="text-sm font-medium">{expense.category?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground text-sm">Merchant</dt>
                  <dd className="merchant-name text-sm font-medium">{expense.merchant}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground text-sm">Expense Date</dt>
                  <dd className="sensitive-data text-sm font-medium">{formatDate(expense.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground text-sm">Submitted</dt>
                  <dd className="sensitive-data text-sm font-medium">
                    {formatDate(expense.submittedAt, 'MMM d, yyyy h:mm a')}
                  </dd>
                </div>
              </dl>
            </CardPanel>
          </Card>

          {/* Notes & Receipt Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardPanel>
                <p className="expense-description text-sm">{expense.description}</p>
                {expense.notes && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="expense-description text-sm">{expense.notes}</p>
                  </div>
                )}
              </CardPanel>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt</CardTitle>
              </CardHeader>
              <CardPanel>
                {expense.receiptUrl ? (
                  <ReceiptView
                    merchant={expense.merchant}
                    amount={expense.amount}
                    date={expense.date}
                    description={expense.description}
                    category={expense.category?.name}
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ReceiptIcon className="size-8 opacity-40" />
                      <p className="text-xs">No receipt uploaded</p>
                    </div>
                  </div>
                )}
              </CardPanel>
            </Card>
          </div>
        </div>

        {/* Confirm Dialog */}
        <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>
                {confirmAction === 'approve' ? 'Approve Expense' : 'Reject Expense'}
              </DialogTitle>
              <DialogDescription>
                {confirmAction === 'approve'
                  ? 'Are you sure you want to approve this expense?'
                  : 'Are you sure you want to reject this expense?'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction === 'reject' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Processing...'
                  : confirmAction === 'approve'
                    ? 'Approve'
                    : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>

        {/* Edit Sheet */}
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetPopup side="right">
            <SheetHeader>
              <SheetTitle>Edit Expense</SheetTitle>
              <SheetDescription>Update expense details.</SheetDescription>
            </SheetHeader>
            <SheetPanel>
              <ExpenseForm
                expense={expense}
                onSubmit={handleEdit}
                onCancel={() => setEditOpen(false)}
                isSubmitting={isSubmitting}
              />
            </SheetPanel>
          </SheetPopup>
        </Sheet>
      </div>
    </ErrorBoundary>
  );
}
