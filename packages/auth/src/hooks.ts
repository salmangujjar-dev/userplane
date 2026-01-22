import { AuthErrors, FormEmailSchema } from '@workspace/contract';
import { isDisposableEmail } from '@workspace/shared';
import { APIError } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';

import { isDisposableEmailCheckEnabled, isEmailNormalizationEnabled } from './flags';

/**
 * Normalize user email during creation
 * - Trims whitespace
 * - Converts to lowercase
 *
 * Feature flag: ENABLE_EMAIL_NORMALIZATION (disabled by default)
 */
function normalizeUserEmail(user: { email: string; [key: string]: unknown }): {
  email: string;
  [key: string]: unknown;
} {
  const result = FormEmailSchema.safeParse(user.email);
  if (result.success) {
    return { ...user, email: result.data };
  }
  return user;
}

/**
 * Database hook to normalize user email before creation
 */
export const userCreateHook = {
  before: async (user: { email: string; [key: string]: unknown }) => {
    if (!isEmailNormalizationEnabled()) {
      return { data: user };
    }
    return {
      data: normalizeUserEmail(user),
    };
  },
};

/**
 * Check if email uses a disposable domain
 * Throws APIError if disposable email is detected
 */
function validateEmailDomain(email: string): void {
  if (isDisposableEmail(email)) {
    throw new APIError('FORBIDDEN', {
      message: AuthErrors.DISPOSABLE_EMAIL_NOT_ALLOWED.message,
    });
  }
}

/**
 * Middleware hook to enforce email domain restrictions
 * Blocks disposable email addresses during sign-up flows
 *
 * Feature flag: ENABLE_DISPOSABLE_EMAIL_CHECK (disabled by default)
 */
export const authMiddlewareHook = createAuthMiddleware(async (ctx) => {
  if (!isDisposableEmailCheckEnabled()) {
    return;
  }

  // Only check sign-up endpoints
  if (!ctx.path.startsWith('/sign-up')) {
    return;
  }

  const email = ctx.body?.email;
  if (email && typeof email === 'string') {
    validateEmailDomain(email);
  }
});
