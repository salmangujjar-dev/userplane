/**
 * RefundRepository - Data access layer for payment refunds
 *
 * Handles all database operations for refund entities:
 * - Recording refunds from webhooks
 * - Querying refund history
 * - Updating refund status
 */

import type { DbClient } from '@workspace/db';
import { and, eq } from '@workspace/db';
import { refunds } from '@workspace/db';

import type { Transaction } from '@/api/types';

import { generateRefundId } from '../lib/id';

export interface UpsertRefundData {
  refundId: string;
  paymentId: string;
  subscriptionId?: string | null;
  workspaceId?: string | null;
  amount: number;
  status: string;
  reason?: string | null;
}

export class RefundRepository {
  constructor(private db: DbClient) {}

  /**
   * Upsert a refund record (create or update based on refundId)
   */
  async upsert(data: UpsertRefundData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    // Try to find existing refund
    const existing = await this.findByRefundId(data.refundId, options);

    if (existing) {
      // Update existing refund
      const [updated] = await dbClient
        .update(refunds)
        .set({
          status: data.status,
          reason: data.reason,
          // Update subscription/workspace if not set previously
          ...(data.subscriptionId &&
            !existing.subscriptionId && { subscriptionId: data.subscriptionId }),
          ...(data.workspaceId && !existing.workspaceId && { workspaceId: data.workspaceId }),
          updatedAt: new Date(),
        })
        .where(eq(refunds.refundId, data.refundId))
        .returning();

      return updated;
    }

    // Create new refund
    const [refund] = await dbClient
      .insert(refunds)
      .values({
        id: generateRefundId(),
        refundId: data.refundId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        workspaceId: data.workspaceId,
        amount: data.amount,
        status: data.status,
        reason: data.reason,
      })
      .returning();

    return refund;
  }

  /**
   * Find refund by Dodo refund ID
   */
  async findByRefundId(refundId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [refund] = await dbClient
      .select()
      .from(refunds)
      .where(eq(refunds.refundId, refundId))
      .limit(1);

    return refund || null;
  }

  /**
   * Find refunds by payment ID
   */
  async findByPaymentId(paymentId: string) {
    return this.db.select().from(refunds).where(eq(refunds.paymentId, paymentId));
  }

  /**
   * Check if workspace has any successful refunds
   * This is the key query for entitlement blocking
   */
  async hasSuccessfulRefund(workspaceId: string): Promise<boolean> {
    const [refund] = await this.db
      .select({ id: refunds.id })
      .from(refunds)
      .where(and(eq(refunds.workspaceId, workspaceId), eq(refunds.status, 'succeeded')))
      .limit(1);

    return !!refund;
  }
}
