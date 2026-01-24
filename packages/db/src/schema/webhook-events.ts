/**
 * Webhook Events table for tracking DodoPayments webhook processing
 *
 * This table provides:
 * - Idempotency tracking (prevent duplicate processing)
 * - Audit trail for debugging
 * - State transition history
 * - Error tracking for failed webhooks
 */

import { boolean, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Webhook events table for tracking all incoming DodoPayments webhooks
 */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    // Primary identifier - from DodoPayments webhook-id header
    id: text('id').primaryKey(),

    // Event metadata
    eventType: text('event_type').notNull(),
    businessId: text('business_id').notNull(),

    // Timestamps
    eventTimestamp: timestamp('event_timestamp').notNull(),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),

    // Processing status
    processed: boolean('processed').default(false).notNull(),
    processingError: text('processing_error'),

    // Related entity IDs
    subscriptionId: text('subscription_id'),
    customerId: text('customer_id'),

    // Full webhook payload for debugging
    payload: jsonb('payload').notNull(),

    // State transition tracking
    previousStatus: text('previous_status'),
    newStatus: text('new_status'),

    // Skip tracking
    transitionSkipped: boolean('transition_skipped').default(false).notNull(),
    skipReason: text('skip_reason'),
  },
  (table) => [
    // Index for looking up by subscription ID
    index('webhook_events_subscription_id_idx').on(table.subscriptionId),
    // Index for finding unprocessed webhooks
    index('webhook_events_processed_idx').on(table.processed),
    // Index for ordering by received time
    index('webhook_events_received_at_idx').on(table.receivedAt),
    // Index for customer lookups
    index('webhook_events_customer_id_idx').on(table.customerId),
  ]
);

/**
 * Type for webhook event record
 */
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
