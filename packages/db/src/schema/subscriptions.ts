import type { AddonItems } from '@workspace/contract';
import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from '@workspace/payments/types';
import { BILLING_CADENCES, type BillingCadence } from '@workspace/pricing';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

/**
 * Subscriptions table for tracking DodoPayments subscriptions
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    // Primary identifier (internal UUID)
    id: text('id').primaryKey(),

    // Workspace reference
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId),

    // DodoPayments identifiers
    customerId: text('customer_id').notNull(),
    subscriptionId: text('subscription_id').notNull(),
    productId: text('product_id').notNull(),

    // Plan mapping (references @workspace/pricing PlanId)
    planId: text('plan_id').notNull(),

    // Subscription status
    status: text('status').$type<SubscriptionStatus>().notNull().default('pending'),

    // Billing period
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),

    // Cancellation info
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),

    // Feature gates (from Dodo product metadata)
    featureGates: jsonb('feature_gates').$type<Record<string, boolean>>(),
    // Subscription add-ons (from Dodo subscription payload)
    addons: jsonb('addons').$type<AddonItems>(),

    // Trial period
    trialEnd: timestamp('trial_end', { withTimezone: true }),

    // Billing cadence: 'monthly' | 'annual' | null (null = free/unknown)
    billingCadence: text('billing_cadence').$type<BillingCadence>(),

    // Webhook tracking for out-of-order detection
    lastWebhookId: text('last_webhook_id'),
    lastWebhookTimestamp: timestamp('last_webhook_timestamp', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Each workspace can have only one active subscription
    uniqueIndex('subscriptions_workspace_id_idx').on(table.workspaceId),
    // Index for looking up by DodoPayments subscription ID
    uniqueIndex('subscriptions_subscription_id_idx').on(table.subscriptionId),
    // Index for customer lookups (NOT unique - customers can have multiple subscriptions)
    index('subscriptions_customer_id_idx').on(table.customerId),
    check(
      'subscriptions_status_check',
      sql`${table.status} IN (${sql.raw(SUBSCRIPTION_STATUSES.map((v) => `'${v}'`).join(', '))})`
    ),
    check(
      'subscriptions_billing_cadence_check',
      sql`${table.billingCadence} IS NULL OR ${table.billingCadence} IN (${sql.raw(BILLING_CADENCES.map((v) => `'${v}'`).join(', '))})`
    ),
  ]
);

/**
 * Subscription relations
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subscriptions.workspaceId],
    references: [workspaces.workspaceId],
  }),
}));
