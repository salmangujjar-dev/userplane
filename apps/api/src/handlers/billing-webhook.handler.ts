/**
 * Billing Webhook Handler
 *
 * Processes DodoPayments webhook events and updates the database accordingly.
 * This handler is called by the Better Auth DodoPayments plugin.
 */

import {
  type DodoSubscription,
  getPlanIdFromProductId,
  isSubscriptionEvent,
  parseSubscriptionDates,
  type SubscriptionWebhookEvent,
  type WebhookPayload,
} from '@workspace/payments';

import type { BillingService } from '@/api/services/billing.service';
import type { EmailService } from '@/api/services/email.service';

export interface BillingWebhookHandlerDeps {
  billingService: BillingService;
  emailService: EmailService;
}

/**
 * Create the webhook handler function for DodoPayments
 */
export function createBillingWebhookHandler(deps: BillingWebhookHandlerDeps) {
  const { billingService } = deps;

  return async (payload: unknown): Promise<void> => {
    const webhookPayload = payload as WebhookPayload;
    const { event_type, data } = webhookPayload;

    if (!isSubscriptionEvent(event_type)) {
      console.log(`[Billing Webhook] Ignoring non-subscription event: ${event_type}`);
      return;
    }

    console.log(`[Billing Webhook] Processing event: ${event_type}`);

    const subscription = data as DodoSubscription;
    const dates = parseSubscriptionDates(subscription);
    const planId = getPlanIdFromProductId(subscription.product_id);

    const webhookData = {
      subscriptionId: subscription.subscription_id,
      customerId: subscription.customer.customer_id,
      productId: subscription.product_id,
      status: subscription.status,
      currentPeriodStart: dates.currentPeriodStart,
      currentPeriodEnd: dates.currentPeriodEnd,
      cancelledAt: dates.cancelledAt,
      metadata: subscription.metadata,
    };

    try {
      switch (event_type as SubscriptionWebhookEvent) {
        case 'subscription.active':
          if (!planId) {
            console.error(`[Billing Webhook] Unknown product ID: ${subscription.product_id}`);
            return;
          }
          await billingService.handleSubscriptionActive(webhookData, planId);
          console.log(`[Billing Webhook] Subscription activated: ${subscription.subscription_id}`);
          // TODO: Send subscription active email
          break;

        case 'subscription.updated':
          await billingService.handleSubscriptionUpdated(webhookData, planId);
          console.log(`[Billing Webhook] Subscription updated: ${subscription.subscription_id}`);
          break;

        case 'subscription.renewed':
          await billingService.handleSubscriptionRenewed(webhookData);
          console.log(`[Billing Webhook] Subscription renewed: ${subscription.subscription_id}`);
          // TODO: Send subscription renewed email
          break;

        case 'subscription.plan_changed':
          if (!planId) {
            console.error(
              `[Billing Webhook] Unknown product ID for plan change: ${subscription.product_id}`
            );
            return;
          }
          await billingService.handleSubscriptionPlanChanged(webhookData, planId);
          console.log(
            `[Billing Webhook] Subscription plan changed: ${subscription.subscription_id}`
          );
          // TODO: Send plan change email
          break;

        case 'subscription.cancelled':
          await billingService.handleSubscriptionCancelled(webhookData);
          console.log(`[Billing Webhook] Subscription cancelled: ${subscription.subscription_id}`);
          // TODO: Send cancellation email
          break;

        case 'subscription.on_hold':
          await billingService.handleSubscriptionOnHold(webhookData);
          console.log(`[Billing Webhook] Subscription on hold: ${subscription.subscription_id}`);
          // TODO: Send payment failed email
          break;

        case 'subscription.failed':
          await billingService.handleSubscriptionFailed(webhookData);
          console.log(`[Billing Webhook] Subscription failed: ${subscription.subscription_id}`);
          break;

        case 'subscription.expired':
          await billingService.handleSubscriptionExpired(webhookData);
          console.log(`[Billing Webhook] Subscription expired: ${subscription.subscription_id}`);
          // TODO: Send expiration email
          break;

        default:
          console.log(`[Billing Webhook] Unhandled event type: ${event_type}`);
      }
    } catch (error) {
      console.error(`[Billing Webhook] Error processing ${event_type}:`, error);
      throw error;
    }
  };
}
