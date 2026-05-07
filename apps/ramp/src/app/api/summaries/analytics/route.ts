import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import { getAnalyticsSummary } from '@/lib/data/finance-summaries';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/summaries/analytics');
  const data = await getAnalyticsSummary();
  return NextResponse.json({ success: true, data });
});
