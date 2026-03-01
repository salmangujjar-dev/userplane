/**
 * Authentication middleware for oRPC procedures
 * Integrates with Better Auth to validate sessions and add user context
 */

import { implement } from '@orpc/server';
import { accountError, contract } from '@userplane/contract';

import { auth } from '@/api/clients/auth';

export type InitialContext = {
  headers: Headers;
};

export type AuthContext = InitialContext & {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

export const base = implement(contract).$context<InitialContext>();

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    throw accountError.UNAUTHORIZED();
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

export const authorized = base.use(authMiddleware);
