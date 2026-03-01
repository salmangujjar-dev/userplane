/**
 * WebhookEventsRepository - Data access layer for webhook events
 *
 * Handles all database operations for webhook event tracking:
 * - Idempotency checks (prevent duplicate processing)
 * - Audit trail storage
 * - Processing status management
 */

import type { DbClient } from '@userplane/db';
import { eq } from '@userplane/db';
import { webhookEvents } from '@userplane/db';

import type { Transaction } from '@/api/types';

export interface CreateWebhookEventData {
  id: string;
  eventType: string;
  businessId: string;
  eventTimestamp: Date;
  subscriptionId?: string;
  customerId?: string;
  payload: Record<string, unknown>;
}

export interface MarkProcessedData {
  previousStatus?: string;
  newStatus?: string;
}

export interface MarkSkippedData {
  previousStatus?: string;
  skipReason: string;
}

export interface MarkFailedData {
  error: string;
}

export class WebhookEventsRepository {
  constructor(private db: DbClient) {}

  /**
   * Check if a webhook event has already been processed (idempotency)
   */
  async exists(webhookId: string): Promise<boolean> {
    const [event] = await this.db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.id, webhookId))
      .limit(1);

    return !!event;
  }

  /**
   * Check if a webhook event has been successfully processed
   */
  async isProcessed(webhookId: string): Promise<boolean> {
    const [event] = await this.db
      .select({ processed: webhookEvents.processed })
      .from(webhookEvents)
      .where(eq(webhookEvents.id, webhookId))
      .limit(1);

    return event?.processed ?? false;
  }

  /**
   * Find a webhook event by ID
   */
  async findById(webhookId: string) {
    const [event] = await this.db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, webhookId))
      .limit(1);

    return event || null;
  }

  /**
   * Create a new webhook event record
   */
  async create(data: CreateWebhookEventData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [event] = await dbClient
      .insert(webhookEvents)
      .values({
        id: data.id,
        eventType: data.eventType,
        businessId: data.businessId,
        eventTimestamp: data.eventTimestamp,
        subscriptionId: data.subscriptionId,
        customerId: data.customerId,
        payload: data.payload,
        processed: false,
        transitionSkipped: false,
      })
      .returning();

    return event;
  }

  /**
   * Mark a webhook event as successfully processed
   */
  async markProcessed(webhookId: string, data: MarkProcessedData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        transitionSkipped: false,
      })
      .where(eq(webhookEvents.id, webhookId))
      .returning();

    return updated || null;
  }

  /**
   * Mark a webhook event as skipped (invalid transition or stale)
   */
  async markSkipped(webhookId: string, data: MarkSkippedData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
        previousStatus: data.previousStatus,
        transitionSkipped: true,
        skipReason: data.skipReason,
      })
      .where(eq(webhookEvents.id, webhookId))
      .returning();

    return updated || null;
  }

  /**
   * Mark a webhook event as failed
   */
  async markFailed(webhookId: string, data: MarkFailedData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(webhookEvents)
      .set({
        processed: false,
        processingError: data.error,
      })
      .where(eq(webhookEvents.id, webhookId))
      .returning();

    return updated || null;
  }

  /**
   * Find webhook events by subscription ID
   */
  async findBySubscriptionId(subscriptionId: string, limit = 20) {
    return this.db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.subscriptionId, subscriptionId))
      .orderBy(webhookEvents.receivedAt)
      .limit(limit);
  }

  /**
   * Find unprocessed webhook events for retry
   */
  async findUnprocessed(limit = 100) {
    return this.db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.processed, false))
      .orderBy(webhookEvents.receivedAt)
      .limit(limit);
  }
}
