import * as Sentry from '@sentry/node';
import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import { getDodoClient } from '@/api/clients/dodo';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { withSentryInngest } from '@/api/sentry';

const logger = createAppLogger('inngest:delete-workspace-resources');

/**
 * deleteWorkspaceResources - Cleanup function for workspace resources
 *
 * Event: workspace/delete-resources
 * Input: { workspaceId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify workspace is deleted
 * 2. Cancel active subscription immediately
 * 3. List recordings to clean up
 * 4. Fan-out to delete-recording-resources via inngest.send()
 */
export const deleteWorkspaceResources = inngest.createFunction(
  {
    id: EVENT_NAMES.DELETE_WORKSPACE_RESOURCES,
    retries: 3,
  },
  { event: EVENT_NAMES.DELETE_WORKSPACE_RESOURCES },
  withSentryInngest(async ({ event, step }) => {
    const { workspaceId } = event.data;

    logger.info('Starting workspace resource cleanup', { workspaceId });

    const workspaceRepo = new WorkspaceRepository(db);
    const recordingRepo = new RecordingRepository(db);
    const subscriptionRepo = new SubscriptionRepository(db);
    const dodoClient = getDodoClient();

    // 1. Short-circuit check
    const isDeleted = await step.run('check-workspace-status', async () => {
      return workspaceRepo.isSoftDeleted(workspaceId);
    });

    if (isDeleted === null) {
      logger.info('Workspace not found, skipping', { workspaceId });
      return {
        success: true,
        workspaceId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.info('Workspace not deleted, skipping', { workspaceId });
      return {
        success: true,
        workspaceId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_deleted',
      };
    }

    // 2. Cancel active subscription immediately
    await step.run('cancel-subscription', async () => {
      try {
        const subscription = await subscriptionRepo.findByWorkspaceId(workspaceId);

        if (subscription && subscription.status === 'active') {
          await dodoClient.subscriptions.update(subscription.subscriptionId, {
            status: 'cancelled',
          });
          logger.info('Subscription cancelled immediately', {
            workspaceId,
            subscriptionId: subscription.subscriptionId,
          });
        }
      } catch (error) {
        logger.error('Failed to cancel subscription during cleanup', { workspaceId, error });
        Sentry.captureException(error, {
          level: 'error',
          tags: { operation: 'subscription_cancellation', workspace_id: workspaceId },
          contexts: {
            subscription: { workspace_id: workspaceId, step: 'workspace_deletion_cleanup' },
          },
        });
      }
    });

    // 3. List recordings to clean up
    const recordingsToCleanup = await step.run('list-recordings', async () => {
      return recordingRepo.findByWorkspaceId(workspaceId);
    });

    logger.info('Found recordings to cleanup', { workspaceId, count: recordingsToCleanup.length });

    // 4. Fan-out in batches of 500
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of recordingChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((recording) => ({
              name: EVENT_NAMES.DELETE_RECORDING_RESOURCES as const,
              data: { recordingId: recording.recordingId },
              id: buildRecordingDeletionKey(recording.recordingId),
              ...(getPurgeDelayTimestamp(recording.uploadStatus)
                ? { ts: getPurgeDelayTimestamp(recording.uploadStatus) }
                : {}),
            }))
          );
        });

        logger.info('Triggered recording cleanup batch', {
          workspaceId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }
    }

    return {
      success: true,
      workspaceId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  })
);
