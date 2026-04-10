import { NextRequest, NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const POST = withFailureInjection(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    log.debug({ id }, 'POST /api/expenses/[id]/approve');

    // Endpoint-specific flag: database connection lost
    if (isFailureActive('expenseApproval')) {
      log.error(
        {
          endpoint: 'POST /api/expenses/[id]/approve',
          flag: 'expenseApproval',
          injectedError: 'database_connection_lost',
        },
        'injected endpoint failure'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection lost during transaction commit. Please retry.',
        },
        { status: 500 }
      );
    }

    const expense = repo.getExpense(id);
    if (!expense) {
      log.debug({ id }, 'POST /api/expenses/[id]/approve not found');
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const updated = repo.updateExpense(id, { status: 'approved' });
    log.debug({ id, previousStatus: expense.status }, 'expense approved');
    return NextResponse.json({ success: true, data: updated });
  }
);
