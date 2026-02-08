import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

import { getUserMetadata } from '../../flags/utils';

export const GET: APIRoute = async () => {
  try {
    // Get the API secret from environment variables
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const apiSecret = import.meta.env.INTERCOM_API_SECRET;

    if (!apiSecret) {
      return new Response(JSON.stringify({ error: 'INTERCOM_API_SECRET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user metadata
    const userMetadata = getUserMetadata();

    // Create JWT payload with user information
    const payload = {
      user_id: userMetadata.user_id,
      email: userMetadata.user_email,
      name: userMetadata.user_name,
      company: userMetadata.user_company,
      created_at: parseInt(userMetadata.user_created_at),
    };

    // Sign the JWT with the API secret
    const token = jwt.sign(payload, apiSecret, { expiresIn: '1h' });

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating Intercom JWT:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate JWT' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
