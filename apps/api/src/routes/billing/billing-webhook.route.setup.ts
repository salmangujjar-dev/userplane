/**
 * Billing Webhook Route Setup
 *
 * Composition root for the billing webhook subsystem.
 * Wires up repositories, processor services, and the webhook handler.
 */

import { db } from '@/api/clients/db';
import { getDodoClient } from '@/api/clients/dodo';
import { cacheService } from '@/api/clients/redis';
import { createBillingWebhookHandler } from '@/api/handlers/billing-webhook.handler';
import { DisputeRepository } from '@/api/repositories/disputes.repository';
import { RefundRepository } from '@/api/repositories/refunds.repository';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { WebhookEventsRepository } from '@/api/repositories/webhook-events.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { DisputeProcessorService } from '@/api/services/dispute-processor.service';
import { entitlementService } from '@/api/services/index';
import { RefundProcessorService } from '@/api/services/refund-processor.service';
import { WebhookProcessorService } from '@/api/services/webhook-processor.service';

import { createBillingWebhookRoute } from './billing-webhook.route';

// Repositories
const subscriptionRepo = new SubscriptionRepository(db);
const webhookEventsRepo = new WebhookEventsRepository(db);
const disputeRepo = new DisputeRepository(db);
const refundRepo = new RefundRepository(db);
const workspaceRepo = new WorkspaceRepository(db);

const dodoClient = getDodoClient();

// Processor services
const webhookProcessor = new WebhookProcessorService({
  subscriptionRepo,
  webhookEventsRepo,
  workspaceRepo,
  entitlementService,
  db,
  dodoClient,
  cacheService,
});

const disputeProcessor = new DisputeProcessorService({
  disputeRepo,
  subscriptionRepo,
  webhookEventsRepo,
  db,
  dodoClient,
  cacheService,
});

const refundProcessor = new RefundProcessorService({
  refundRepo,
  subscriptionRepo,
  webhookEventsRepo,
  db,
  dodoClient,
  cacheService,
});

// Wire up handler and route
const handleBillingWebhook = createBillingWebhookHandler({
  webhookProcessor,
  disputeProcessor,
  refundProcessor,
});

export const billingWebhookRoute = createBillingWebhookRoute({
  dodoClient,
  handleBillingWebhook,
});
