import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

import { log } from '@/lib/logger';

export async function GET() {
  log.debug('GET /api/intercom-jwt');
  try {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const apiSecret = process.env.INTERCOM_API_SECRET;
    const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID;

    if (!apiSecret) {
      log.error('INTERCOM_API_SECRET not configured');
      return NextResponse.json({ error: 'INTERCOM_API_SECRET not configured' }, { status: 500 });
    }
    if (!userId) {
      log.error('NEXT_PUBLIC_DEMO_USER_ID not configured');
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DEMO_USER_ID not configured' },
        { status: 500 }
      );
    }

    // Intercom identity verification uses HMAC-SHA256 of the user_id
    // https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile
    const userHash = createHmac('sha256', apiSecret).update(userId).digest('hex');

    log.debug({ userId }, 'intercom-jwt generated');

    return NextResponse.json({
      user_hash: userHash,
      user_id: userId,
      email: process.env.NEXT_PUBLIC_DEMO_USER_EMAIL,
      name: process.env.NEXT_PUBLIC_DEMO_USER_NAME,
      company: process.env.NEXT_PUBLIC_DEMO_USER_COMPANY,
      created_at: Number(process.env.NEXT_PUBLIC_DEMO_USER_CREATED_AT),
    });
  } catch (error) {
    log.error({ err: error }, 'failed to generate intercom user hash');
    return NextResponse.json({ error: 'Failed to generate user hash' }, { status: 500 });
  }
}
