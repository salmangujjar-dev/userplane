import { NextRequest, NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const POST = withFailureInjection(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    log.debug({ id }, 'POST /api/expenses/[id]/reject');

    // Endpoint-specific flag: transaction deadlock
    if (isFailureActive('expenseRejection')) {
      log.error(
        {
          endpoint: 'POST /api/expenses/[id]/reject',
          flag: 'expenseRejection',
          injectedError: 'transaction_deadlock',
        },
        'injected endpoint failure'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction deadlock detected. Automatic retry failed after 3 attempts.',
        },
        { status: 500 }
      );
    }

    const expense = repo.getExpense(id);
    if (!expense) {
      log.debug({ id }, 'POST /api/expenses/[id]/reject not found');
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const updated = repo.updateExpense(id, { status: 'rejected' });
    log.debug({ id, previousStatus: expense.status }, 'expense rejected');
    return NextResponse.json({ success: true, data: updated });
  }
);
