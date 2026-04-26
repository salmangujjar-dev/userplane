import { NextRequest, NextResponse } from 'next/server';

import { clearAllOverrides, loadAndApplyOverrides, setOverrides } from '@/lib/feature-flag-service';
import {
  type FeatureFlag,
  FLAG_DEFAULTS,
  getRuntimeFlags,
  getRuntimeVariants,
  VARIANT_DEFAULTS,
  type VariantFlag,
} from '@/lib/feature-flags';

function getResponseData() {
  return { flags: getRuntimeFlags(), variants: getRuntimeVariants() };
}

export async function GET() {
  await loadAndApplyOverrides();
  return NextResponse.json({ success: true, data: getResponseData() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === 'reset-all') {
    await clearAllOverrides();
    return NextResponse.json({ success: true, data: getResponseData() });
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

    // Validate variant overrides
    const rawVariants = body.variantOverrides;
    let validVariantOverrides: Partial<Record<VariantFlag, string>> | undefined;
    if (typeof rawVariants === 'object' && rawVariants !== null && !Array.isArray(rawVariants)) {
      validVariantOverrides = {};
      for (const [key, value] of Object.entries(rawVariants)) {
        if (key in VARIANT_DEFAULTS && typeof value === 'string') {
          validVariantOverrides[key as VariantFlag] = value;
        }
      }
    }

    await setOverrides(validOverrides, validVariantOverrides);
    return NextResponse.json({ success: true, data: getResponseData() });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
