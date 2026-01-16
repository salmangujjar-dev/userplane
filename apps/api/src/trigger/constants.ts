/**
 * Trigger task configuration constants
 * Centralized configuration for all Trigger.dev tasks
 */

/**
 * Batch limits for trigger operations
 * Maximum number of tasks that can be triggered in a single batchTrigger call
 */
export const BATCH_LIMITS = {
  MAX_BATCH_SIZE: 500, // Maximum tasks per batchTrigger call
} as const;

/**
 * Task IDs for deletion tasks
 */
export const TASK_IDS = {
  DELETE_RECORDING_RESOURCES: 'delete-recording-resources',
  DELETE_LINK_RESOURCES: 'delete-link-resources',
  DELETE_PROJECT_RESOURCES: 'delete-project-resources',
  DELETE_WORKSPACE_RESOURCES: 'delete-workspace-resources',
  CLEANUP_ORPHANED_WORKSPACE: 'cleanup-orphaned-workspace',
  SWEEP_ORPHANED_WORKSPACES: 'sweep-orphaned-workspaces',
  CLEANUP_ORPHANED_PROJECT: 'cleanup-orphaned-project',
  SWEEP_ORPHANED_PROJECTS: 'sweep-orphaned-projects',
  SWEEP_ORPHANED_RECORDINGS: 'sweep-orphaned-recordings',
  CHECK_STALE_RECORDING: 'check-stale-recording',
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
  ORPHANED_PROJECT_SWEEP: 600, // 10 minutes
  ORPHANED_RECORDING_SWEEP: 600, // 10 minutes
  STALE_CHECK: 120, // 2 minutes
} as const;
