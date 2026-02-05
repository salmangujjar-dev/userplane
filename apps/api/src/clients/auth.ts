import {
  APIError,
  createAuth,
  createDodoPaymentsPlugin,
  setWebhookContextProvider,
} from '@workspace/auth';
import { eq } from '@workspace/db';
import * as schema from '@workspace/db/schema';
import { getDodoPaymentsClient } from '@workspace/payments/client';
import { CHECKOUT_PRODUCTS } from '@workspace/payments/products';
import type { DodoPaymentsConfig } from '@workspace/payments/types';

import { db } from '@/api/clients/db';
import { cacheService } from '@/api/clients/redis';
import { env } from '@/api/env';
import { createBillingWebhookHandler } from '@/api/handlers/billing-webhook.handler';
import { getWebhookContext } from '@/api/lib/webhook-context';
import { DisputeRepository } from '@/api/repositories/disputes.repository';
import { RefundRepository } from '@/api/repositories/refunds.repository';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { DisputeProcessorService } from '@/api/services/dispute-processor.service';
import { emailService } from '@/api/services/email.service';
import { entitlementService } from '@/api/services/index';
import { RefundProcessorService } from '@/api/services/refund-processor.service';
import { WebhookProcessorService } from '@/api/services/webhook-processor.service';

const workspaceRepository = new WorkspaceRepository(db);

// Wire up webhook context provider so the Better Auth adapter can access
// webhook headers (webhook-id, webhook-timestamp) from AsyncLocalStorage
setWebhookContextProvider(getWebhookContext);

// DodoPayments configuration
const dodoConfig: DodoPaymentsConfig = {
  apiKey: env.payments.apiKey || '',
  webhookSecret: env.payments.webhookSecret || '',
  environment: env.payments.environment,
};

// Get singleton DodoPayments client
const dodoClient = getDodoPaymentsClient(dodoConfig);

// Create repositories
const subscriptionRepo = new SubscriptionRepository(db);
const webhookEventsRepo = new WebhookEventsRepository(db);
const disputeRepo = new DisputeRepository(db);
const refundRepo = new RefundRepository(db);

// Create webhook processor service with all dependencies
const webhookProcessor = new WebhookProcessorService({
  subscriptionRepo,
  webhookEventsRepo,
  workspaceRepo: workspaceRepository,
  entitlementService,
  db,
  dodoClient, // For upstream verification
  cacheService, // For cache invalidation
});

// Create dispute processor service for handling payment disputes
const disputeProcessor = new DisputeProcessorService({
  disputeRepo,
  subscriptionRepo,
  webhookEventsRepo,
  db,
  dodoClient, // For payment → subscription mapping
  cacheService, // For cache invalidation
});

// Create refund processor service for handling payment refunds
const refundProcessor = new RefundProcessorService({
  refundRepo,
  subscriptionRepo,
  webhookEventsRepo,
  db,
  dodoClient, // For payment → subscription mapping
  cacheService, // For cache invalidation
});

// Create billing webhook handler
const handleBillingWebhook = createBillingWebhookHandler({
  webhookProcessor,
  disputeProcessor,
  refundProcessor,
});

// Create DodoPayments plugin for Better Auth
const dodoPaymentsPlugin = createDodoPaymentsPlugin({
  client: dodoClient,
  createCustomerOnSignUp: true,
  products: CHECKOUT_PRODUCTS,
  successUrl: `${env.dashboard.baseUrl}/`,
  webhookSecret: dodoConfig.webhookSecret,
  authenticatedUsersOnly: true,
  onWebhookPayload: handleBillingWebhook,
});

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
  plugins: [dodoPaymentsPlugin],
  featureFlags: {
    enableEmailNormalization: true,
    enableNameNormalization: true,
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
        console.error('Failed to revoke sessions:', error);
      }

      // Send account deletion confirmation email
      await emailService.sendSafeAccountDeletion({ to: user.email });
    },
  },
});

export type Auth = typeof auth;
