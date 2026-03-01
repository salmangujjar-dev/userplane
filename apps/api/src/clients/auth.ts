import { APIError, createAuth } from '@userplane/auth';
import { eq } from '@userplane/db';
import * as schema from '@userplane/db/schema';

import { db } from '@/api/clients/db';
import { getDodoClient } from '@/api/clients/dodo';
import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { emailService } from '@/api/services/email.service';

const authLogger = createLogger('auth');
const workspaceRepository = new WorkspaceRepository(db);

export const auth = createAuth({
  database: db,
  secret: env.auth.secret,
  baseURL: env.auth.url,
  // trustedOrigins enforces which domains can USE the auth API (access control)
  // Combined with cookieDomain (which domains can READ cookies), this provides security:
  // untrusted subdomains may read cookies but cannot authenticate without being listed here
  trustedOrigins: [...env.cors.origins, env.auth.url],
  cookiePrefix: env.auth.cookiePrefix,
  // Cookie domain for cross-subdomain sharing (preview/staging/production only)
  // Enables cookies set on api.userplane.io to be read by dash.userplane.io
  cookieDomain: env.auth.cookieDomain,
  nodeEnv: env.server.nodeEnv,
  appEnv: env.server.appEnv,
  google: {
    clientId: env.google.clientId,
    clientSecret: env.google.clientSecret,
    redirectURI: env.google.redirectUri,
  },
  admin: {
    adminUserIds: env.admin.userIds,
  },
  featureFlags: {
    enableEmailNormalization: true,
    enableNameNormalization: true,
  },
  onUserCreated: async (user) => {
    try {
      await getDodoClient().customers.create({
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      authLogger.error({ err: error, userId: user.id }, 'Failed to create DodoPayments customer');
      captureException(error);
    }
  },
  email: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendSafeEmailVerification(
        { to: user.email },
        {
          userName: user.name,
          verificationUrl: url,
        }
      );
    },
    sendMagicLink: async ({ email, url }) => {
      await emailService.sendSafeMagicLink(
        { to: email },
        {
          magicLinkUrl: url,
        }
      );
    },
  },
  deleteUser: {
    sendDeleteAccountVerification: async ({ user, token }) => {
      await emailService.sendSafeAccountDeletionVerification(
        { to: user.email },
        {
          deletionToken: token,
        }
      );
    },
    beforeDelete: async (user) => {
      // Check if user is a member of any active workspaces
      const workspaceCount = await workspaceRepository.countByUserId(user.id);

      if (workspaceCount > 0) {
        throw new APIError('BAD_REQUEST', {
          message: `You must leave all workspaces before deleting your account. You are currently a member of ${workspaceCount} workspace(s).`,
        });
      }
    },
    afterDelete: async (user) => {
      // Revoke all sessions for the user by deleting from database
      try {
        await db.delete(schema.session).where(eq(schema.session.userId, user.id));
      } catch (error) {
        // Log error but don't block deletion email
        authLogger.error({ err: error }, 'Failed to revoke sessions');
        captureException(error, undefined, { operation: 'auth_delete_user_revoke_sessions' });
      }

      // Send account deletion confirmation email
      await emailService.sendSafeAccountDeletion({ to: user.email });
    },
  },
});

export type Auth = typeof auth;
