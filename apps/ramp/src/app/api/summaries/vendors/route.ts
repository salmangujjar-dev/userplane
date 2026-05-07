import { NextRequest, NextResponse } from 'next/server';

import { parsePagination } from '@/lib/api/pagination';
import { withFailureInjection } from '@/lib/api/with-failure-injection';
import { getVendorDirectorySummary } from '@/lib/data/finance-summaries';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async (request: NextRequest) => {
  log.debug('GET /api/summaries/vendors');

  if (isFailureActive('vendorsEndpoint')) {
    return NextResponse.json(
      { success: false, error: 'Procurement sync failed. Vendor directory is stale.' },
      { status: 502 }
    );
  }

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);
  if (pagination.error) {
    return NextResponse.json({ success: false, error: pagination.error }, { status: 400 });
  }

  const data = await getVendorDirectorySummary({
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    signal: searchParams.get('signal') || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return NextResponse.json({ success: true, data });
});
