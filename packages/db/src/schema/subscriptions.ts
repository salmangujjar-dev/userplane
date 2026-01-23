import { SUBSCRIPTION_STATUSES } from '@workspace/payments';
import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

/**
 * Subscription status enum from DodoPayments
 * Uses official subscription status values from the dodopayments package
 */
export const subscriptionStatusEnum = pgEnum('subscription_status', SUBSCRIPTION_STATUSES);

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
    status: subscriptionStatusEnum('status').notNull().default('pending'),

    // Billing period
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),

    // Cancellation info
    cancelledAt: timestamp('cancelled_at'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Each workspace can have only one active subscription
    uniqueIndex('subscriptions_workspace_id_idx').on(table.workspaceId),
    // Index for looking up by DodoPayments subscription ID
    uniqueIndex('subscriptions_subscription_id_idx').on(table.subscriptionId),
    // Index for customer lookups
    uniqueIndex('subscriptions_customer_id_idx').on(table.customerId),
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
