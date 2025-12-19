/**
 * Authentication middleware for oRPC procedures
 * Integrates with Better Auth to validate sessions and add user context
 */

import { ORPCError } from '@orpc/server';
import { auth } from '@/api/clients/auth';
import { implement } from '@orpc/server';
import { contract } from '@workspace/contract';

export type InitialContext = {
  headers: Headers;
};

export type AuthContext = InitialContext & {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
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
    throw new ORPCError('UNAUTHORIZED', {
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

export const authorized = base.use(authMiddleware);
