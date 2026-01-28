/**
 * Sentry instrumentation wrapper for Trigger.dev tasks
 * Provides automatic error capture with task context
 */
import * as Sentry from '@sentry/bun';

/**
 * Wraps a Trigger.dev task with Sentry error capture
 * Automatically adds task ID and payload context to captured errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSentryTrigger<TPayload = any, TOutput = any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taskFn: (payload: TPayload, params: any) => Promise<TOutput>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (payload: TPayload, params: any) => Promise<TOutput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (payload: TPayload, params: any) => {
    const { ctx } = params;

    try {
      // Set task context for Sentry
      Sentry.setContext('trigger_task', {
        taskId: ctx.task.id,
        runId: ctx.run.id,
        attemptNumber: ctx.attempt.number,
      });

      // Add payload as extra data (careful with sensitive info)
      Sentry.setTag('task_id', ctx.task.id);

      // Execute the actual task
      return await taskFn(payload, params);
    } catch (error) {
      // Capture error with task context
      Sentry.captureException(error, {
        tags: {
          task_id: ctx.task.id,
          run_id: ctx.run.id,
        },
        contexts: {
          trigger_task: {
            taskId: ctx.task.id,
            runId: ctx.run.id,
            attemptNumber: ctx.attempt.number,
          },
        },
      });

      // Re-throw to let Trigger.dev handle retry logic
      throw error;
    }
  };
}
