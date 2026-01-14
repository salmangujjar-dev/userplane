import { createAuth } from '@workspace/auth';
import { createAppLogger } from '@workspace/logger';
import { renderEmailVerification, renderMagicLink } from '@workspace/email';
import { db } from '@/api/clients/db';
import { emailClient } from '@/api/clients/email';
import { env } from '@/api/env';

const logger = createAppLogger('auth-client');

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
      const html = await renderEmailVerification({
        userName: user.name || 'there',
        verificationUrl: url,
      });

      await emailClient.send(
        {
          from: `Userplane <${env.email.inboxes.auth}>`,
          to: user.email,
          subject: 'Verify your email address',
          html,
        },
        {
          idempotencyKey: `email-verification/${user.email}`,
        }
      );

      logger.info(
        {
          to: user.email,
          fromInbox: env.email.inboxes.auth,
          provider: emailClient.getProvider(),
        },
        'Verification email sent'
      );
    },
    sendMagicLink: async ({ email, url }) => {
      const html = await renderMagicLink({
        magicLinkUrl: url,
      });

      await emailClient.send(
        {
          from: `Userplane <${env.email.inboxes.auth}>`,
          to: email,
          subject: 'Sign in to Userplane',
          html,
        },
        {
          // Use timestamp to allow multiple magic links
          idempotencyKey: `magic-link/${email}/${Date.now()}`,
        }
      );

      logger.info(
        {
          to: email,
          fromInbox: env.email.inboxes.auth,
          provider: emailClient.getProvider(),
        },
        'Magic link email sent'
      );
    },
  },
});

export type Auth = typeof auth;
