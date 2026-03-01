import { AuthErrors, FormEmailSchema } from '@userplane/contract';
import { isDisposableEmail } from '@userplane/shared';
import { APIError } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';

import {
  isDisposableEmailCheckEnabled,
  isEmailNormalizationEnabled,
  isNameNormalizationEnabled,
} from './flags';

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
 * Populate user name from email if name is empty
 * - Extracts username from email (part before @)
 * - Capitalizes first letter
 * - Replaces dots, hyphens, underscores with spaces
 *
 * Why: Ensures users always have a displayable name even if they don't provide one
 */
function populateNameFromEmail(user: {
  email: string;
  name?: string | null;
  [key: string]: unknown;
}): {
  email: string;
  name: string;
  [key: string]: unknown;
} {
  if (user.name && user.name.trim() !== '') {
    return { ...user, name: user.name };
  }

  const emailUsername = user.email.split('@')[0];
  if (!emailUsername) {
    return { ...user, name: 'User' };
  }

  const formattedName = emailUsername
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { ...user, name: formattedName.trim() !== '' ? formattedName : 'User' };
}

/**
 * Database hook to normalize user email and populate name before creation
 * - Normalizes email (if enabled)
 * - Populates name from email if empty (if enabled)
 */
export const userCreateHook = {
  before: async (user: {
    email: string;
    name?: string | null;
    [key: string]: unknown;
  }): Promise<{ data: { email: string; name: string; [key: string]: unknown } }> => {
    let processedUser = user;

    // This is done to ensure the email from non UI input fields are normalized
    // For example: Google OAuth flow or other onboarding flows outside of the dashboard
    if (isEmailNormalizationEnabled()) {
      processedUser = normalizeUserEmail(processedUser);
    }

    // Dodopayment requires a name to kickoff the checkout process
    // If the name is empty, we'll use the email username as a fallback
    // If the email username is empty, we'll use 'User' as a fallback
    // WARNING: Disabling this flag may break Dodopayment integration
    if (isNameNormalizationEnabled()) {
      const result = populateNameFromEmail(processedUser);
      return {
        data: result,
      };
    }

    // If name normalization is disabled, we still need to ensure name is a string
    // to satisfy the return type and database constraints
    return {
      data: {
        ...processedUser,
        name: processedUser.name || 'User',
      },
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
