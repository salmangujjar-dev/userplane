import { auth } from '../lib/auth';
export async function authMiddleware(c, next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  c.set('user', session?.user || null);
  c.set('session', session?.session || null);
  await next();
}
export async function requireAuth(c, next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
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
