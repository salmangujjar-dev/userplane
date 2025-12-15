/**
 * Trigger task configuration constants
 * Centralized configuration for all Trigger.dev tasks
 */

/**
 * Task IDs for deletion tasks
 */
export const TASK_IDS = {
  DELETE_RECORDING_RESOURCES: 'delete-recording-resources',
  DELETE_LINK_RESOURCES: 'delete-link-resources',
  DELETE_PROJECT_RESOURCES: 'delete-project-resources',
  DELETE_WORKSPACE_RESOURCES: 'delete-workspace-resources',
  SWEEP_ORPHANED_DELETIONS: 'sweep-orphaned-deletions',
} as const;

/**
 * Task ID type
 */
export type TaskId = (typeof TASK_IDS)[keyof typeof TASK_IDS];

/**
 * Max duration for tasks in seconds
 */
export const MAX_DURATIONS = {
  RECORDING_CLEANUP: 300, // 5 minutes
  LINK_CLEANUP: 300, // 5 minutes
  PROJECT_CLEANUP: 300, // 5 minutes
  WORKSPACE_CLEANUP: 300, // 5 minutes
  ORPHANED_SWEEP: 600, // 10 minutes
} as const;

/**
 * Schedule configuration
 */
export const SCHEDULES = {
  ORPHANED_SWEEP: {
    ID: 'sweep-orphaned-deletions-schedule',
    CRON: '*/10 * * * *', // Every 10 minutes
  },
} as const;
