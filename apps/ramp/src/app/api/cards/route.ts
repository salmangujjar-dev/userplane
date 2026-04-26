import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import * as repo from '@/lib/db/repository';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/cards');

  if (isFailureActive('cardsEndpoint')) {
    log.error(
      {
        endpoint: 'GET /api/cards',
        flag: 'cardsEndpoint',
        injectedError: 'issuer_processor_unavailable',
      },
      'injected endpoint failure'
    );
    return NextResponse.json(
      { success: false, error: 'Issuer processor unavailable. Card data is delayed.' },
      { status: 503 }
    );
  }

  const data = await repo.getCards();
  log.debug({ count: data.length }, 'GET /api/cards response');
  return NextResponse.json({ success: true, data });
});
