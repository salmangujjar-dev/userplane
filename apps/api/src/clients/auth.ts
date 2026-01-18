import { APIError, createAuth } from '@workspace/auth';
import { eq } from '@workspace/db';
import * as schema from '@workspace/db/schema';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { emailService } from '@/api/services/email.service';

const workspaceRepository = new WorkspaceRepository(db);

export const auth = createAuth({
  database: db,
  secret: env.auth.secret,
  baseURL: env.auth.url,
  trustedOrigins: env.cors.origins,
  cookiePrefix: env.auth.cookiePrefix,
  google: {
    clientId: env.google.clientId,
    clientSecret: env.google.clientSecret,
    redirectURI: env.google.redirectUri,
  },
  admin: {
    adminUserIds: env.admin.userIds,
  },
  email: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendEmailVerification({
        to: user.email,
        userName: user.name,
        verificationUrl: url,
      });
    },
    sendMagicLink: async ({ email, url }) => {
      await emailService.sendMagicLink({
        to: email,
        magicLinkUrl: url,
      });
    },
  },
  deleteUser: {
    sendDeleteAccountVerification: async ({ user, token }) => {
      const customUrl = `${env.invite.appUrl}/accounts/delete?token=${token}`;
      await emailService.sendAccountDeletionVerification({
        to: user.email,
        userName: user.name,
        verificationUrl: customUrl,
      });
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
        console.error('Failed to revoke sessions:', error);
      }

      // Send account deletion confirmation email
      await emailService.sendAccountDeletion({
        to: user.email,
        userName: user.name,
        feedbackUrl: `${env.invite.appUrl}/feedback`,
      });
    },
  },
});

export type Auth = typeof auth;
