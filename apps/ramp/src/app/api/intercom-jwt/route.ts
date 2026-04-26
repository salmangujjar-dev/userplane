import { createHmac } from 'crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function GET() {
  log.debug('GET /api/intercom-jwt');
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const apiSecret = process.env.INTERCOM_API_SECRET;
    if (!apiSecret) {
      log.error('INTERCOM_API_SECRET not configured');
      return NextResponse.json({ error: 'INTERCOM_API_SECRET not configured' }, { status: 500 });
    }

    const { user } = session;

    // Intercom identity verification uses HMAC-SHA256 of the user_id
    // https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile
    const userHash = createHmac('sha256', apiSecret).update(user.id).digest('hex');

    log.debug({ userId: user.id }, 'intercom-jwt generated');

    return NextResponse.json({
      user_hash: userHash,
      user_id: user.id,
      email: user.email,
      name: user.name,
      company: process.env.NEXT_PUBLIC_RAMP_COMPANY_NAME ?? 'Spense',
      created_at: user.createdAt
        ? Math.floor(new Date(user.createdAt).getTime() / 1000)
        : undefined,
    });
  } catch (error) {
    log.error({ err: error }, 'failed to generate intercom user hash');
    return NextResponse.json({ error: 'Failed to generate user hash' }, { status: 500 });
  }
}
