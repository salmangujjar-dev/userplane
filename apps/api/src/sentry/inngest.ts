/**
 * Sentry instrumentation wrapper for Inngest functions
 * Provides automatic error capture with function context
 */
import * as Sentry from '@sentry/node';
import { type BackgroundTaskContext, buildTaskTags, TagNames } from '@workspace/sentry';
import { nanoid } from 'nanoid';

/**
 * Wraps an Inngest function handler with Sentry error capture
 * Automatically adds function ID and event context to captured errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSentryInngest<
  TArgs extends { event?: any; step: any; attempt?: number },
  TOutput,
>(handler: (args: TArgs) => Promise<TOutput>): (args: TArgs) => Promise<TOutput> {
  return async (args: TArgs) => {
    const eventName = args.event?.name ?? 'cron';
    const runId = nanoid();
    const attemptNumber = args.attempt ?? 0;

    const taskContext: BackgroundTaskContext = {
      taskId: eventName,
      runId,
      attemptNumber,
    };

    try {
      Sentry.setContext('inngest_function', taskContext);
      Sentry.setTag(TagNames.TASK_ID, eventName);

      return await handler(args);
    } catch (error) {
      Sentry.captureException(error, {
        tags: buildTaskTags({
          taskId: eventName,
          runId,
        }),
        contexts: {
          inngest_function: taskContext,
        },
      });

      throw error;
    }
  };
}
