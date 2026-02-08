import { NextRequest, NextResponse } from 'next/server';

import { store } from '@/lib/data/store';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortField = searchParams.get('sortField') || undefined;
  const sortDir = searchParams.get('sortDir') || undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
  const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined;

  const { data: expenses, total } = store.getExpenses({
    status,
    categoryId,
    employeeId,
    search,
    sortField,
    sortDir,
    page,
    pageSize,
  });

  // Populate relations
  const data = expenses.map((expense) => ({
    ...expense,
    employee: store.getEmployee(expense.employeeId),
    category: store.getCategory(expense.categoryId),
  }));

  return NextResponse.json({
    success: true,
    data,
    total,
    ...(page != null && { page, pageSize: pageSize ?? 10 }),
  });
}

export async function POST(request: NextRequest) {
  // Feature flag: reject expense creation when disabled
  if (!isFeatureEnabled('createExpenseSubmit')) {
    return NextResponse.json(
      { success: false, error: 'Expense creation is temporarily unavailable' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { employeeId, categoryId, amount, description, merchant, date, notes } = body;

    if (!employeeId || !categoryId || !amount || !description || !merchant || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const expense = store.createExpense({
      employeeId,
      categoryId,
      amount: Number(amount),
      description,
      merchant,
      date,
      notes,
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
