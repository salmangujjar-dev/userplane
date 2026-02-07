import * as Sentry from '@sentry/node';

import { db } from '@/api/clients/db';
import { getDodoClient } from '@/api/clients/dodo';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { createLogger } from '@/api/lib/logger';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';

const logger = createLogger('inngest:delete-workspace-resources');

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
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    logger.info({ workspaceId }, 'Starting workspace resource cleanup');

    const workspaceRepo = new WorkspaceRepository(db);
    const recordingRepo = new RecordingRepository(db);
    const subscriptionRepo = new SubscriptionRepository(db);
    const dodoClient = getDodoClient();

    // 1. Short-circuit check
    const isDeleted = await step.run('check-workspace-status', async () => {
      return workspaceRepo.isSoftDeleted(workspaceId);
    });

    if (isDeleted === null) {
      logger.info({ workspaceId }, 'Workspace not found, skipping');
      return {
        success: true,
        workspaceId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.info({ workspaceId }, 'Workspace not deleted, skipping');
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
          logger.info(
            {
              workspaceId,
              subscriptionId: subscription.subscriptionId,
            },
            'Subscription cancelled immediately'
          );
        }
      } catch (error) {
        logger.error({ workspaceId, error }, 'Failed to cancel subscription during cleanup');
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

    logger.info({ workspaceId, count: recordingsToCleanup.length }, 'Found recordings to cleanup');

    // 4. Fan-out in batches of 500
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of recordingChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((recording) => ({
              name: EVENT_NAMES.DELETE_RECORDING_RESOURCES,
              data: { recordingId: recording.recordingId },
              id: buildRecordingDeletionKey(recording.recordingId),
              ...(getPurgeDelayTimestamp(recording.uploadStatus)
                ? { ts: getPurgeDelayTimestamp(recording.uploadStatus) }
                : {}),
            }))
          );
        });

        logger.info(
          {
            workspaceId,
            batchIndex: index + 1,
            batchCount: recordingChunks.length,
            recordingsInBatch: chunk.length,
          },
          'Triggered recording cleanup batch'
        );
      }
    }

    return {
      success: true,
      workspaceId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  }
);
