import { NextRequest, NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

const expenseStatuses = new Set(['pending', 'approved', 'rejected']);
const expenseSortFields = new Set(['date', 'amount', 'employee', 'category', 'status']);
const sortDirections = new Set(['asc', 'desc']);
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type ParseOptionalIntResult =
  | { value: number | undefined; error?: never }
  | { error: string; value?: never };

type ParsedExpenseFilters = { filters: repo.ExpenseFilters } | { error: string };

function parseOptionalInt(
  value: string | null,
  field: string,
  minimum = 0
): ParseOptionalIntResult {
  if (value == null) return { value: undefined };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return {
      error:
        minimum > 0
          ? `${field} must be a positive integer`
          : `${field} must be a non-negative integer`,
    };
  }
  return { value: parsed };
}

function parseExpenseFilters(searchParams: URLSearchParams): ParsedExpenseFilters {
  const status = searchParams.get('status') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortField = searchParams.get('sortField') || undefined;
  const sortDir = searchParams.get('sortDir') || undefined;
  const pageResult = parseOptionalInt(searchParams.get('page'), 'page');
  const pageSizeResult = parseOptionalInt(searchParams.get('pageSize'), 'pageSize', 1);

  if (pageResult.error) return { error: pageResult.error };
  if (pageSizeResult.error) return { error: pageSizeResult.error };
  if (status && !expenseStatuses.has(status)) {
    return { error: 'status must be pending, approved, or rejected' };
  }
  if (sortField && !expenseSortFields.has(sortField)) {
    return { error: 'sortField must be date, amount, employee, category, or status' };
  }
  if (sortDir && !sortDirections.has(sortDir)) {
    return { error: 'sortDir must be asc or desc' };
  }

  const pageSize = Math.min(pageSizeResult.value ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  return {
    filters: {
      status,
      categoryId,
      employeeId,
      search,
      sortField,
      sortDir,
      page: pageResult.value ?? 0,
      pageSize,
    },
  };
}

export const GET = withFailureInjection(async (request: NextRequest) => {
  const parsed = parseExpenseFilters(request.nextUrl.searchParams);
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const { status, categoryId, employeeId, search, sortField, sortDir, page, pageSize } =
    parsed.filters;

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

  const { data, total } = await repo.getExpensesWithRelations({
    status,
    categoryId,
    employeeId,
    search,
    sortField,
    sortDir,
    page,
    pageSize,
  });

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

    const expense = await repo.createExpense({
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
