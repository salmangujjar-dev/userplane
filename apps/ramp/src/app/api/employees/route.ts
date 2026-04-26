import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/employees');

  // Endpoint-specific flag: upstream service unavailable
  if (isFailureActive('employeesEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/employees',
        flag: 'employeesEndpoint',
        injectedError: 'upstream_unavailable',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Upstream identity service unavailable. Retry after 30s.' },
      { status: 503 }
    );
  }

  const data = await repo.getEmployees();
  log.debug({ count: data.length }, 'GET /api/employees response');
  return NextResponse.json({ success: true, data });
});
