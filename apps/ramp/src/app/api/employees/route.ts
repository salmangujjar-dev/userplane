import { NextResponse } from 'next/server';

import { store } from '@/lib/data/store';

export async function GET() {
  const data = store.getEmployees();
  return NextResponse.json({ success: true, data });
}
