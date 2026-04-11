import type { McpDeps } from './types';

/** Validate that a user is an active workspace member. Returns membership info. */
export async function requireWorkspaceMember(deps: McpDeps, userId: string, workspaceId: string) {
  const workspace = await deps.workspaceService.getById(workspaceId);
  const member = await deps.workspaceMemberService.getMembershipForAuth(
    userId,
    workspace.workspaceId
  );
  if (!member) {
    throw new Error('You are not a member of this workspace.');
  }
  return { workspace, member };
}

/** Wrap a value as MCP text content (pretty-printed for readability) */
export function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Derive the recording start time for log timestamp alignment.
 * Prefer the explicit recordingStartedAt stored during upload.
 * Fall back to createdAt - durationMs for older recordings (approximate).
 */
export function getRecordingStartTime(recording: {
  recordingStartedAt: string | Date | null;
  recordingDurationMs: number;
  meta: { createdAt: string | Date };
}): number | undefined {
  if (recording.recordingStartedAt) {
    return new Date(recording.recordingStartedAt).getTime();
  }
  if (recording.meta.createdAt) {
    return new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs;
  }
  return undefined;
}

/**
 * Fetch a thumbnail from its presigned URL and return a base64 data URI.
 * Returns null on any failure — callers degrade gracefully without it.
 */
export async function fetchThumbnailDataUri(
  url: string | null,
  format: string | null
): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || `image/${format || 'png'}`;
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}
