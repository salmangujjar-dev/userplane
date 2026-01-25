/**
 * DisputeRepository - Data access layer for payment disputes
 *
 * Handles all database operations for dispute entities:
 * - Recording disputes from webhooks
 * - Checking for open disputes (entitlement blocking)
 * - Updating dispute status on resolution
 */

import type { DbClient } from '@workspace/db';
import { and, eq } from '@workspace/db';
import { disputes } from '@workspace/db';

import type { Transaction } from '@/api/types';

import { generateDisputeId } from '../lib/id';

export interface UpsertDisputeData {
  disputeId: string;
  paymentId: string;
  subscriptionId?: string | null;
  workspaceId?: string | null;
  amount: number;
  status: string;
  stage?: string | null;
  remarks?: string | null;
  isOpen: boolean;
  resolvedAt?: Date | null;
}

export class DisputeRepository {
  constructor(private db: DbClient) {}

  /**
   * Upsert a dispute record (create or update based on disputeId)
   */
  async upsert(data: UpsertDisputeData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    // Try to find existing dispute
    const existing = await this.findByDisputeId(data.disputeId, options);

    if (existing) {
      // Update existing dispute
      const [updated] = await dbClient
        .update(disputes)
        .set({
          status: data.status,
          stage: data.stage,
          remarks: data.remarks,
          isOpen: data.isOpen,
          resolvedAt: data.resolvedAt,
          // Update subscription/workspace if not set previously
          ...(data.subscriptionId &&
            !existing.subscriptionId && { subscriptionId: data.subscriptionId }),
          ...(data.workspaceId && !existing.workspaceId && { workspaceId: data.workspaceId }),
          updatedAt: new Date(),
        })
        .where(eq(disputes.disputeId, data.disputeId))
        .returning();

      return updated;
    }

    // Create new dispute
    const [dispute] = await dbClient
      .insert(disputes)
      .values({
        id: generateDisputeId(),
        disputeId: data.disputeId,
        paymentId: data.paymentId,
        subscriptionId: data.subscriptionId,
        workspaceId: data.workspaceId,
        amount: data.amount,
        status: data.status,
        stage: data.stage,
        remarks: data.remarks,
        isOpen: data.isOpen,
        resolvedAt: data.resolvedAt,
      })
      .returning();

    return dispute;
  }

  /**
   * Find dispute by Dodo dispute ID
   */
  async findByDisputeId(disputeId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [dispute] = await dbClient
      .select()
      .from(disputes)
      .where(eq(disputes.disputeId, disputeId))
      .limit(1);

    return dispute || null;
  }

  /**
   * Check if workspace has any open disputes
   * This is the key query for entitlement blocking
   */
  async hasOpenDispute(workspaceId: string): Promise<boolean> {
    const [dispute] = await this.db
      .select({ id: disputes.id })
      .from(disputes)
      .where(and(eq(disputes.workspaceId, workspaceId), eq(disputes.isOpen, true)))
      .limit(1);

    return !!dispute;
  }

  /**
   * Find all open disputes for a workspace
   */
  async findOpenByWorkspaceId(workspaceId: string) {
    return this.db
      .select()
      .from(disputes)
      .where(and(eq(disputes.workspaceId, workspaceId), eq(disputes.isOpen, true)));
  }

  /**
   * Find all disputes for a workspace (including resolved)
   */
  async findByWorkspaceId(workspaceId: string) {
    return this.db.select().from(disputes).where(eq(disputes.workspaceId, workspaceId));
  }

  /**
   * Find disputes by subscription ID
   */
  async findBySubscriptionId(subscriptionId: string) {
    return this.db.select().from(disputes).where(eq(disputes.subscriptionId, subscriptionId));
  }
}
