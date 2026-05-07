import { NextRequest, NextResponse } from 'next/server';

import { parsePagination } from '@/lib/api/pagination';
import { withFailureInjection } from '@/lib/api/with-failure-injection';
import { getApprovalSummary } from '@/lib/data/finance-summaries';
import { isFailureActive } from '@/lib/feature-flags';
import { log } from '@/lib/logger';

const risks = new Set(['low', 'medium', 'high']);

export const GET = withFailureInjection(async (request: NextRequest) => {
  log.debug('GET /api/summaries/approvals');

  if (isFailureActive('approvalsQueueEndpoint')) {
    return NextResponse.json(
      { success: false, error: 'Approval queue is temporarily unavailable.' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const risk = searchParams.get('risk') || undefined;
  const pagination = parsePagination(searchParams);

  if (pagination.error) {
    return NextResponse.json({ success: false, error: pagination.error }, { status: 400 });
  }
  if (risk && !risks.has(risk)) {
    return NextResponse.json(
      { success: false, error: 'risk must be low, medium, or high' },
      { status: 400 }
    );
  }

  const data = await getApprovalSummary({
    search: searchParams.get('search') || undefined,
    risk: risk as 'low' | 'medium' | 'high' | undefined,
    department: searchParams.get('department') || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return NextResponse.json({ success: true, data });
});
