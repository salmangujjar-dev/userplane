import { createHmac } from 'crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { log } from '@/lib/logger';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64url');
}

function createJwt(payload: Record<string, unknown>, secret: string, kid: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid }));
  const body = base64url(JSON.stringify(payload));
  // Zendesk docs: pass shared secret as raw string to HS256
  const signature = base64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

export async function GET() {
  log.debug('GET /api/zendesk-jwt');
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signingKey = process.env.ZENDESK_MESSAGING_SIGNING_KEY;
    const signingKeyId = process.env.ZENDESK_MESSAGING_SIGNING_KEY_ID;
    if (!signingKey || !signingKeyId) {
      log.error('ZENDESK_MESSAGING_SIGNING_KEY or ZENDESK_MESSAGING_SIGNING_KEY_ID not configured');
      return NextResponse.json(
        { error: 'Zendesk messaging signing key not configured' },
        { status: 500 }
      );
    }

    const { user } = session;
    const now = Math.floor(Date.now() / 1000);

    // Zendesk messaging JWT authentication
    // https://support.zendesk.com/hc/en-us/articles/4411666638746
    // Zendesk messaging JWT — only documented claims
    // https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/sdks/web/enabling_auth_visitors/
    const token = createJwt(
      {
        scope: 'user',
        external_id: user.id,
        name: user.name,
        email: user.email,
        email_verified: true,
        exp: now + 7200, // 2 hours
      },
      signingKey,
      signingKeyId
    );

    log.debug({ userId: user.id }, 'zendesk-jwt generated');

    return NextResponse.json({ token });
  } catch (error) {
    log.error({ err: error }, 'failed to generate zendesk jwt');
    return NextResponse.json({ error: 'Failed to generate JWT' }, { status: 500 });
  }
}
