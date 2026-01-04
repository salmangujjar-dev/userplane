import { createAuth } from '@workspace/auth';
import { db } from '@/api/clients/db';
import { env } from '@/api/env';

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
});

export type Auth = typeof auth;
