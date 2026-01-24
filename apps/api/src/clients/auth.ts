import { APIError, createAuth, createDodoPaymentsPlugin } from '@workspace/auth';
import { eq } from '@workspace/db';
import * as schema from '@workspace/db/schema';
import {
  CHECKOUT_PRODUCTS,
  type DodoPaymentsConfig,
  getDodoPaymentsClient,
} from '@workspace/payments';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { createBillingWebhookHandler } from '@/api/handlers/billing-webhook.handler';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { emailService } from '@/api/services/email.service';
import { WebhookProcessorService } from '@/api/services/webhook-processor.service';

const workspaceRepository = new WorkspaceRepository(db);

// DodoPayments configuration
const dodoConfig: DodoPaymentsConfig = {
  apiKey: env.dodoPayments.apiKey || '',
  webhookSecret: env.dodoPayments.webhookSecret || '',
  environment: env.dodoPayments.environment,
};

// Get singleton DodoPayments client
const dodoClient = getDodoPaymentsClient(dodoConfig);

// Create repositories
const subscriptionRepo = new SubscriptionRepository(db);
const webhookEventsRepo = new WebhookEventsRepository(db);

// Create webhook processor service with all dependencies
const webhookProcessor = new WebhookProcessorService({
  subscriptionRepo,
  webhookEventsRepo,
  workspaceRepo: workspaceRepository,
  db,
  dodoClient, // For upstream verification
});

// Create billing webhook handler
const handleBillingWebhook = createBillingWebhookHandler({
  webhookProcessor,
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
  trustedOrigins: env.cors.origins,
  cookiePrefix: env.auth.cookiePrefix,
  nodeEnv: env.nodeEnv,
  google: {
    clientId: env.google.clientId,
    clientSecret: env.google.clientSecret,
    redirectURI: env.google.redirectUri,
  },
  admin: {
    adminUserIds: env.admin.userIds,
  },
  plugins: [dodoPaymentsPlugin],
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
