import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'proj_zexjttpszqhvkzmtqzgx', // Replace with your actual project ref from trigger.dev dashboard
  runtime: 'bun',
  logLevel: 'log',
  // Maximum duration for tasks (in seconds)
  maxDuration: 300, // 5 minutes
  // Monorepo: Set the directory where trigger tasks are located (relative to this config file)
  dirs: ['./src/trigger'],
  // Retry defaults for all tasks
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
