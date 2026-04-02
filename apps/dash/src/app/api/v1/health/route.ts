import { NextResponse } from 'next/server';

const APP_VERSION = '0.0.1';

export function GET() {
  return NextResponse.json({
    message: 'Service is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    },
  });
}
