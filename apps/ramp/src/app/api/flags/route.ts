import { NextRequest, NextResponse } from 'next/server';

import { clearAllOverrides, loadAndApplyOverrides } from '@/lib/feature-flag-service';
import { getRuntimeFlags } from '@/lib/feature-flags';

export function GET() {
  loadAndApplyOverrides();
  return NextResponse.json({ success: true, data: getRuntimeFlags() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === 'reset-all') {
    clearAllOverrides();
    return NextResponse.json({ success: true, data: getRuntimeFlags() });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
