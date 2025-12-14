import { task, logger } from '@trigger.dev/sdk/v3';

export const exampleTask = task({
  id: 'example-task',
  // Retry configuration
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { message: string }) => {
    logger.info('Running example task', { payload });

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('Task completed successfully');

    return {
      success: true,
      message: payload.message,
      timestamp: new Date().toISOString(),
    };
  },
});
