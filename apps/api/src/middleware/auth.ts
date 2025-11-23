import type { Context, Next } from 'hono';
import { auth } from '../lib/auth';

export type AuthContext = {
  Variables: {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    } | null;
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    } | null;
  };
};

export async function authMiddleware(c: Context<AuthContext>, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set('user', session?.user || null);
  c.set('session', session?.session || null);

  await next();
}

export async function requireAuth(c: Context<AuthContext>, next: Next) {
  // Log request details for debugging
  const cookieHeader = c.req.header('cookie');
  const authHeader = c.req.header('authorization');

  console.log('[Auth Middleware] Request:', {
    path: c.req.path,
    method: c.req.method,
    hasCookie: !!cookieHeader,
    hasAuth: !!authHeader,
    cookies: cookieHeader,
    origin: c.req.header('origin'),
    referer: c.req.header('referer'),
  });

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  console.log('[Auth Middleware] Session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });

  if (!session?.user) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      },
      401
    );
  }

  c.set('user', session.user);
  c.set('session', session.session);

  await next();
}
