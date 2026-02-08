'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { useEmployees } from '@/hooks/useEmployees';
import type { Expense } from '@/lib/data/types';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExpenseForm({ expense, onSubmit, onCancel, isSubmitting }: ExpenseFormProps) {
  const { employees } = useEmployees();
  const { categories } = useCategories();

  const [employeeId, setEmployeeId] = useState(expense?.employeeId ?? '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [merchant, setMerchant] = useState(expense?.merchant ?? '');
  const [date, setDate] = useState(
    expense?.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(expense?.notes ?? '');

  const getEmployeeName = (id: string) => {
    return employees.find((emp) => emp.id === id)?.name ?? 'Select employee';
  };

  const getCategoryName = (id: string) => {
    return categories.find((cat) => cat.id === id)?.name ?? 'Select category';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId,
      categoryId,
      amount: parseFloat(amount),
      description,
      merchant,
      date: new Date(date).toISOString(),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employee</Label>
        <Select value={employeeId} onValueChange={(val) => setEmployeeId(val as string)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select employee">
              {() => getEmployeeName(employeeId)}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={(val) => setCategoryId(val as string)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select category">
              {() => getCategoryName(categoryId)}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate((e.target as HTMLInputElement).value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Merchant</Label>
        <Input
          placeholder="e.g. United Airlines"
          value={merchant}
          onChange={(e) => setMerchant((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          placeholder="Brief description of expense"
          value={description}
          onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || !employeeId || !categoryId || !amount || !description || !merchant
          }
        >
          {isSubmitting ? 'Saving...' : expense ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
