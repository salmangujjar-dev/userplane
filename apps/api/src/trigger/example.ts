import { task, logger } from '@trigger.dev/sdk/v3';

/**
 * Example trigger.dev task
 * This task demonstrates the basic structure for background jobs
 *
 * Usage:
 *   import { exampleTask } from "@/api/trigger/example";
 *   await exampleTask.trigger({ message: "Hello from trigger!" });
 */
export const exampleTask = task({
  id: 'example-task',
  // Maximum duration for this task
  maxDuration: 300, // 5 minutes
  run: async (payload: { message: string }) => {
    logger.info('Example task started', { payload });

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('Example task completed');

    return {
      success: true,
      message: payload.message,
      processedAt: new Date().toISOString(),
    };
  },
});
