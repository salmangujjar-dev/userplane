import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/vendors');

  if (isFailureActive('vendorsEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/vendors',
        flag: 'vendorsEndpoint',
        injectedError: 'procurement_sync_failed',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Procurement sync failed. Vendor directory is stale.' },
      { status: 502 }
    );
  }

  const data = repo.getVendors();
  log.debug({ count: data.length }, 'GET /api/vendors response');
  return NextResponse.json({ success: true, data });
});
