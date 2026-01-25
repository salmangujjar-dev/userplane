/**
 * Disputes table for tracking DodoPayments payment disputes
 *
 * Disputes are tracked separately from subscriptions to:
 * - Handle multiple disputes per subscription
 * - Provide audit trail for dispute lifecycle
 * - Enable quick entitlement checks via isOpen flag
 *
 * Design: Dispute is a payment-scoped override, not a subscription state.
 * When isOpen is true, entitlements are blocked regardless of subscription status.
 */

import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { subscriptions } from './subscriptions';
import { workspaces } from './workspaces';

/**
 * Disputes table for tracking payment disputes from DodoPayments webhooks
 */
export const disputes = pgTable(
  'disputes',
  {
    // Primary identifier (internal)
    id: text('id').primaryKey(),

    // DodoPayments dispute identifier
    disputeId: text('dispute_id').notNull(),

    // Payment that was disputed
    paymentId: text('payment_id').notNull(),

    // Mapped subscription (if subscription payment)
    subscriptionId: text('subscription_id'),

    // Workspace affected by dispute
    workspaceId: text('workspace_id').references(() => workspaces.workspaceId),

    // Dispute amount in cents
    amount: integer('amount').notNull(),

    // Dispute status from Dodo (opened, won, lost, etc.)
    status: text('status').notNull(),

    // Dispute stage from Dodo
    stage: text('stage'),

    // Remarks/reason from Dodo
    remarks: text('remarks'),

    // Quick check for open disputes - dominates entitlements when true
    isOpen: boolean('is_open').default(true).notNull(),

    // When dispute was resolved (won, lost, cancelled, etc.)
    resolvedAt: timestamp('resolved_at'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Each Dodo dispute ID should be unique
    uniqueIndex('disputes_dispute_id_idx').on(table.disputeId),
    // Index for looking up disputes by subscription
    index('disputes_subscription_id_idx').on(table.subscriptionId),
    // Index for looking up disputes by workspace
    index('disputes_workspace_id_idx').on(table.workspaceId),
    // Index for quick open dispute checks
    index('disputes_is_open_idx').on(table.isOpen),
  ]
);

/**
 * Dispute relations
 */
export const disputesRelations = relations(disputes, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [disputes.workspaceId],
    references: [workspaces.workspaceId],
  }),
  subscription: one(subscriptions, {
    fields: [disputes.subscriptionId],
    references: [subscriptions.subscriptionId],
  }),
}));

/**
 * Type for dispute record
 */
export type Dispute = typeof disputes.$inferSelect;
export type NewDispute = typeof disputes.$inferInsert;
