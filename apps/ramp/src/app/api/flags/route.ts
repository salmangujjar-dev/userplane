import { NextRequest, NextResponse } from 'next/server';

import { clearAllOverrides, loadAndApplyOverrides, setOverrides } from '@/lib/feature-flag-service';
import { type FeatureFlag, FLAG_DEFAULTS, getRuntimeFlags } from '@/lib/feature-flags';

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

  if (body.action === 'save-overrides') {
    const raw = body.overrides;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return NextResponse.json(
        { success: false, error: 'overrides must be an object' },
        { status: 400 }
      );
    }

    const validOverrides: Partial<Record<FeatureFlag, boolean>> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key in FLAG_DEFAULTS && typeof value === 'boolean') {
        validOverrides[key as FeatureFlag] = value;
      }
    }

    setOverrides(validOverrides);
    return NextResponse.json({ success: true, data: getRuntimeFlags() });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
