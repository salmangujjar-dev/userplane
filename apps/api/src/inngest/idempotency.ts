/**
 * Idempotency key builders for Inngest events
 * Ensures consistent and type-safe idempotency key generation
 * Used as the `id` field on inngest.send() for deduplication
 */

/**
 * Build idempotency key for recording deletion
 */
export function buildRecordingDeletionKey(recordingId: string): string {
  return `delete-recording-${recordingId}`;
}

/**
 * Build idempotency key for link deletion
 */
export function buildLinkDeletionKey(linkId: string): string {
  return `delete-link-${linkId}`;
}

/**
 * Build idempotency key for project deletion
 */
export function buildProjectDeletionKey(projectId: string): string {
  return `delete-project-${projectId}`;
}

/**
 * Build idempotency key for workspace deletion
 */
export function buildWorkspaceDeletionKey(workspaceId: string): string {
  return `delete-workspace-${workspaceId}`;
}

export function buildStaleRecordingCheckKey(recordingId: string): string {
  return `check-stale-recording-${recordingId}`;
}
