import { NextRequest, NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortField = searchParams.get('sortField') || undefined;
  const sortDir = searchParams.get('sortDir') || undefined;
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
  const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined;

  log.debug(
    { status, categoryId, employeeId, search, sortField, sortDir, page, pageSize },
    'GET /api/expenses'
  );

  if (status === 'pending' && isFailureActive('approvalsQueueEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/expenses?status=pending',
        flag: 'approvalsQueueEndpoint',
        injectedError: 'approval_queue_unavailable',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Approval queue is temporarily unavailable.' },
      { status: 503 }
    );
  }

  const { data: expenses, total } = repo.getExpenses({
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
    employee: repo.getEmployee(expense.employeeId),
    category: repo.getCategory(expense.categoryId),
  }));

  log.debug({ count: data.length, total }, 'GET /api/expenses response');

  return NextResponse.json({
    success: true,
    data,
    total,
    ...(page != null && { page, pageSize: pageSize ?? 10 }),
  });
});

export const POST = withFailureInjection(async (request: NextRequest) => {
  log.debug('POST /api/expenses');

  if (isFailureActive('createExpenseSubmit')) {
    log.debug('POST /api/expenses blocked by feature flag createExpenseSubmit');
    return NextResponse.json(
      { success: false, error: 'Expense creation is temporarily unavailable' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { employeeId, categoryId, amount, description, merchant, date, notes } = body;

    if (!employeeId || !categoryId || !amount || !description || !merchant || !date) {
      log.debug({ body }, 'POST /api/expenses missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const expense = repo.createExpense({
      employeeId,
      categoryId,
      amount: Number(amount),
      description,
      merchant,
      date,
      notes,
    });

    log.debug({ expenseId: expense.id }, 'POST /api/expenses created');

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/expenses failed');
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
});
