/**
 * Sentry initialization for Trigger.dev tasks
 * This file MUST be imported at the top of every task file
 *
 * It initializes Sentry SDK for the Trigger.dev worker environment
 * and registers a global onFailure hook that captures ALL task failures
 */
import * as Sentry from '@sentry/node';
import { tasks } from '@trigger.dev/sdk/v3';
import {
  buildTaskTags,
  createBeforeSendFilter,
  IGNORED_ERRORS_API,
  TagNames,
} from '@workspace/sentry';

// Initialize Sentry if not already initialized
// Trigger.dev workers run in isolation, so we need to init here
const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV ?? 'development';
const release = process.env.SENTRY_RELEASE;
const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    beforeSend: createBeforeSendFilter(),
    ignoreErrors: [...IGNORED_ERRORS_API],
  });
}

// Register global onFailure hook
// This catches ALL task failures, even if the task doesn't use withSentryTrigger
tasks.onFailure(async ({ error, ctx, payload }) => {
  if (!dsn) return;

  const taskContext = {
    taskId: ctx.task.id,
    runId: ctx.run.id,
    attemptNumber: ctx.attempt.number,
    isRetry: ctx.attempt.number > 1,
  };

  // Set context for this error
  Sentry.setContext('trigger_task', taskContext);
  Sentry.setTag(TagNames.TASK_ID, ctx.task.id);

  // Capture the exception with full context
  Sentry.captureException(error, {
    tags: buildTaskTags({
      taskId: ctx.task.id,
      runId: ctx.run.id,
    }),
    contexts: {
      trigger_task: taskContext,
    },
    extra: {
      payload,
    },
  });

  // Flush to ensure the error is sent before the worker terminates
  await Sentry.flush(2000);
});
