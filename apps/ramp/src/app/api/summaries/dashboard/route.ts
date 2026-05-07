import { NextResponse } from 'next/server';

import { withFailureInjection } from '@/lib/api/with-failure-injection';
import { getDashboardSummary } from '@/lib/data/finance-summaries';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async () => {
  log.debug('GET /api/summaries/dashboard');
  const data = await getDashboardSummary();
  return NextResponse.json({ success: true, data });
});
