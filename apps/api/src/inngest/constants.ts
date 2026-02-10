/**
 * Inngest function configuration constants
 * Centralized configuration for all Inngest functions
 */

/**
 * Batch limits for send operations
 * Maximum number of events that can be sent in a single inngest.send() call
 */
export const BATCH_LIMITS = {
  MAX_BATCH_SIZE: 500,
} as const;

/**
 * Event names for all Inngest functions
 */
export const EVENT_NAMES = {
  DELETE_RECORDING_RESOURCES: 'recording/delete-resources',
  DELETE_LINK_RESOURCES: 'link/delete-resources',
  DELETE_PROJECT_RESOURCES: 'project/delete-resources',
  DELETE_WORKSPACE_RESOURCES: 'workspace/delete-resources',
  CLEANUP_ORPHANED_WORKSPACE: 'workspace/cleanup-orphaned',
  SWEEP_ORPHANED_WORKSPACES: 'workspace/sweep-orphaned',
  CLEANUP_ORPHANED_PROJECT: 'project/cleanup-orphaned',
  SWEEP_ORPHANED_PROJECTS: 'project/sweep-orphaned',
  SWEEP_ORPHANED_RECORDINGS: 'recording/sweep-orphaned',
  CHECK_STALE_RECORDING: 'recording/check-stale',
  SWEEP_EXPIRED_RECORDINGS: 'recording/sweep-expired',
} as const;

/**
 * Event name type
 */
export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

/**
 * Max duration for functions in seconds
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
  EXPIRED_RECORDING_SWEEP: 600, // 10 minutes
} as const;
