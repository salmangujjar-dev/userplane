import { createAuth } from '@workspace/auth';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { emailService } from '@/api/services/email.service';

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
});

export type Auth = typeof auth;
