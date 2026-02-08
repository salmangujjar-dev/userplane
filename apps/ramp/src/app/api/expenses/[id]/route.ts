import { NextRequest, NextResponse } from 'next/server';

import { store } from '@/lib/data/store';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = store.getExpense(id);
  if (!expense) {
    return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
  }

  const data = {
    ...expense,
    employee: store.getEmployee(expense.employeeId),
    category: store.getCategory(expense.categoryId),
  };

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = store.updateExpense(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
