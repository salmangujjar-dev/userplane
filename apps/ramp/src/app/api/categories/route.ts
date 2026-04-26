import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/categories');

  // Endpoint-specific flag: cache poisoned
  if (isFailureActive('categoriesEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/categories',
        flag: 'categoriesEndpoint',
        injectedError: 'cache_poisoned',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Cache layer returned poisoned data. Manual flush required.' },
      { status: 500 }
    );
  }

  const data = await repo.getCategories();
  log.debug({ count: data.length }, 'GET /api/categories response');
  return NextResponse.json({ success: true, data });
});
