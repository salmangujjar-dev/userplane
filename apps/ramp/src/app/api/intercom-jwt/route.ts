import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

// Demo user for the ramp app -- replace with real auth in production
const DEMO_USER = {
  user_id: 'emp_4f8a2c',
  email: 'novocayn@gmail.com',
  name: 'Sarah Chen',
  company: 'Spense',
  created_at: 1737734400, // 2025-01-24
};

export async function GET() {
  try {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const apiSecret = process.env.INTERCOM_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json({ error: 'INTERCOM_API_SECRET not configured' }, { status: 500 });
    }

    // Intercom identity verification uses HMAC-SHA256 of the user_id
    // https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile
    const userHash = createHmac('sha256', apiSecret).update(DEMO_USER.user_id).digest('hex');

    return NextResponse.json({
      user_hash: userHash,
      user_id: DEMO_USER.user_id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      company: DEMO_USER.company,
      created_at: DEMO_USER.created_at,
    });
  } catch (error) {
    console.error('Error generating Intercom user hash:', error);
    return NextResponse.json({ error: 'Failed to generate user hash' }, { status: 500 });
  }
}
