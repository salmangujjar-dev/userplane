import { Hono } from 'hono';
import { authMiddleware, requireAuth, type AuthContext } from '../middleware/auth';

const authTest = new Hono<AuthContext>();

authTest.use('*', authMiddleware);

authTest.get('/me', requireAuth, (c) => {
  const user = c.get('user');
  const session = c.get('session');

  return c.json({
    user,
    session: {
      id: session?.id,
      expiresAt: session?.expiresAt,
    },
  });
});

authTest.get('/public', (c) => {
  const user = c.get('user');

  return c.json({
    message: 'This is a public endpoint',
    authenticated: !!user,
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      : null,
  });
});

export default authTest;
