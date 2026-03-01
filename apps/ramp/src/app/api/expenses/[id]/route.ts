import { NextRequest, NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    log.debug({ id }, 'GET /api/expenses/[id]');

    // Endpoint-specific flag: intermittent failure (50% chance)
    if (!isFeatureEnabled('expenseDetailEndpoint') && Math.random() < 0.5) {
      log.error(
        {
          endpoint: 'GET /api/expenses/[id]',
          flag: 'expenseDetailEndpoint',
          injectedError: 'database_reset',
        },
        'injected endpoint failure'
      );
      return NextResponse.json(
        { success: false, error: 'Database connection reset during query execution.' },
        { status: 500 }
      );
    }

    const expense = repo.getExpense(id);
    if (!expense) {
      log.debug({ id }, 'GET /api/expenses/[id] not found');
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const data = {
      ...expense,
      employee: repo.getEmployee(expense.employeeId),
      category: repo.getCategory(expense.categoryId),
    };

    return NextResponse.json({ success: true, data });
  }
);

export const PUT = withFailureInjection(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    log.debug({ id }, 'PUT /api/expenses/[id]');

    // Endpoint-specific flag: conflict error
    if (!isFeatureEnabled('expenseUpdate')) {
      log.error(
        { endpoint: 'PUT /api/expenses/[id]', flag: 'expenseUpdate', injectedError: 'conflict' },
        'injected endpoint failure'
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Conflict: this record was modified by another user. Please refresh and try again.',
        },
        { status: 409 }
      );
    }

    try {
      const body = await request.json();
      const updated = repo.updateExpense(id, body);
      if (!updated) {
        log.debug({ id }, 'PUT /api/expenses/[id] not found');
        return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
      }
      log.debug({ id }, 'PUT /api/expenses/[id] updated');
      return NextResponse.json({ success: true, data: updated });
    } catch (err) {
      log.error({ id, err }, 'PUT /api/expenses/[id] failed');
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
  }
);
