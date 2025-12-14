import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  // Replace with your project ref from the Trigger.dev dashboard
  project: 'proj_zexjttpszqhvkzmtqzgx',
  runtime: 'bun',
  // Set the log level for the logger
  logLevel: 'info',
  // Maximum duration for tasks (in seconds)
  maxDuration: 300,
  // The paths to the task files
  dirs: ['./src'],
});
