import { NextRequest, NextResponse } from 'next/server';

import { store } from '@/lib/data/store';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = store.getExpense(id);
  if (!expense) {
    return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
  }

  const updated = store.updateExpense(id, { status: 'rejected' });
  return NextResponse.json({ success: true, data: updated });
}
