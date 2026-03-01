import { NextRequest, NextResponse } from 'next/server';

import { clearOverride, setOverride } from '@/lib/feature-flag-service';
import { type FeatureFlag, FLAG_DEFAULTS, getRuntimeFlags } from '@/lib/feature-flags';

type RouteContext = { params: Promise<{ flag: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const { flag } = await context.params;

  if (!(flag in FLAG_DEFAULTS)) {
    return NextResponse.json({ success: false, error: `Unknown flag: ${flag}` }, { status: 404 });
  }

  const body = await request.json();
  if (typeof body.value !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'Body must include { value: boolean }' },
      { status: 400 }
    );
  }

  setOverride(flag as FeatureFlag, body.value);
  return NextResponse.json({ success: true, data: getRuntimeFlags() });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { flag } = await context.params;

  if (!(flag in FLAG_DEFAULTS)) {
    return NextResponse.json({ success: false, error: `Unknown flag: ${flag}` }, { status: 404 });
  }

  clearOverride(flag as FeatureFlag);
  return NextResponse.json({ success: true, data: getRuntimeFlags() });
}
