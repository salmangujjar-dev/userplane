import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Demo user for the ramp app -- replace with real auth in production
const DEMO_USER = {
  user_id: 'emp_4f8a2c',
  email: 'sarah.chen@spense.io',
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

    // Sign a JWT with user information for Intercom identity verification
    const token = jwt.sign(
      {
        user_id: DEMO_USER.user_id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        company: DEMO_USER.company,
        created_at: DEMO_USER.created_at,
      },
      apiSecret,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Intercom JWT:', error);
    return NextResponse.json({ error: 'Failed to generate JWT' }, { status: 500 });
  }
}
