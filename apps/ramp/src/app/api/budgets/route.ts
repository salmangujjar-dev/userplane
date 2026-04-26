import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/budgets');

  if (isFailureActive('budgetsEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/budgets',
        flag: 'budgetsEndpoint',
        injectedError: 'budget_checksum_mismatch',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Budget ledger checksum mismatch. Reconciliation required.' },
      { status: 500 }
    );
  }

  const data = repo.getDepartmentBudgets();
  log.debug({ count: data.length }, 'GET /api/budgets response');
  return NextResponse.json({ success: true, data });
});
