/**
 * Refunds table for tracking DodoPayments payment refunds
 *
 * Refunds are tracked separately from subscriptions to:
 * - Handle multiple refunds per subscription
 * - Provide audit trail for refund lifecycle
 * - Track refund success/failure status
 */

import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { subscriptions } from './subscriptions';
import { workspaces } from './workspaces';

/**
 * Refunds table for tracking payment refunds from DodoPayments webhooks
 */
export const refunds = pgTable(
  'refunds',
  {
    // Primary identifier (internal)
    id: text('id').primaryKey(),

    // DodoPayments refund identifier
    refundId: text('refund_id').notNull(),

    // Payment that was refunded
    paymentId: text('payment_id').notNull(),

    // Mapped subscription (if subscription payment)
    subscriptionId: text('subscription_id'),

    // Workspace affected by refund
    workspaceId: text('workspace_id').references(() => workspaces.workspaceId),

    // Refund amount in cents
    amount: integer('amount').notNull(),

    // Refund status from Dodo (succeeded, failed)
    status: text('status').notNull(),

    // Reason for refund (if provided)
    reason: text('reason'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Each Dodo refund ID should be unique
    uniqueIndex('refunds_refund_id_idx').on(table.refundId),
    // Index for looking up refunds by payment
    index('refunds_payment_id_idx').on(table.paymentId),
    // Index for looking up refunds by subscription
    index('refunds_subscription_id_idx').on(table.subscriptionId),
    // Index for looking up refunds by workspace
    index('refunds_workspace_id_idx').on(table.workspaceId),
    // Index for status queries
    index('refunds_status_idx').on(table.status),
  ]
);

/**
 * Refund relations
 */
export const refundsRelations = relations(refunds, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [refunds.workspaceId],
    references: [workspaces.workspaceId],
  }),
  subscription: one(subscriptions, {
    fields: [refunds.subscriptionId],
    references: [subscriptions.subscriptionId],
  }),
}));

/**
 * Type for refund record
 */
export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;
