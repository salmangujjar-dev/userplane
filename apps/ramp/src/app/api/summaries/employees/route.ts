import { NextRequest, NextResponse } from 'next/server';

import { parsePagination } from '@/lib/api/pagination';
import { withFailureInjection } from '@/lib/api/with-failure-injection';
import { getEmployeeDirectorySummary } from '@/lib/data/finance-summaries';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

export const GET = withFailureInjection(async (request: NextRequest) => {
  log.debug('GET /api/summaries/employees');

  if (isFailureActive('employeesEndpoint')) {
    return NextResponse.json(
      { success: false, error: 'Upstream identity service unavailable. Retry after 30s.' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);
  if (pagination.error) {
    return NextResponse.json({ success: false, error: pagination.error }, { status: 400 });
  }

  const data = await getEmployeeDirectorySummary({
    search: searchParams.get('search') || undefined,
    department: searchParams.get('department') || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return NextResponse.json({ success: true, data });
});
