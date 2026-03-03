import { useMemo } from 'react';

import type { VideoMarker } from '@/components/player/types';

const EMPTY_MARKERS: VideoMarker[] = [];
import { useConsoleLogData, useRecordingConsoleLog } from '@/features/recordings';
import type { RecordingDetail } from '@/types';

import { formatSerializedValue } from './console-log-types';

/**
 * Generates red VideoMarker dots on the seek bar for each console error in the recording.
 *
 * Uses the same React Query keys as RecordingLogReplayPanel, so data is deduplicated —
 * no extra network requests when both the Console tab and the seek bar are visible.
 *
 * @param workspaceId - Workspace ID, or null for the shared recording page
 * @param recordingId - Recording ID
 * @param recording - Recording detail (may be undefined while loading)
 * @param consoleLogUrl - Optional direct URL (shared page already has it)
 */
export function useConsoleErrorMarkers(
  workspaceId: string | null,
  recordingId: string,
  recording: RecordingDetail | undefined,
  consoleLogUrl?: string
): VideoMarker[] {
  // Step 1: Fetch the presigned URL for the console log resource (workspace page).
  // On the shared page workspaceId is null, so this query stays disabled.
  const consoleLogResource = useRecordingConsoleLog(workspaceId, recordingId);
  const resourceUrl = consoleLogResource.data?.success
    ? consoleLogResource.data.data.resource.url
    : null;

  // Prefer the explicitly-provided URL (shared page), fall back to the resource hook.
  const url = consoleLogUrl ?? resourceUrl ?? undefined;

  // Step 2: Fetch the actual console log entries from the presigned URL.
  // Uses the same query key shape as RecordingLogReplayPanel → React Query deduplication.
  const { data: entries } = useConsoleLogData(workspaceId ?? recordingId, recordingId, url);

  return useMemo(() => {
    if (!entries || !recording) return EMPTY_MARKERS;

    // Derive the recording start time (same logic as RecordingLogReplayPanel).
    const recordingStartTime = recording.recordingStartedAt
      ? new Date(recording.recordingStartedAt).getTime()
      : recording.meta.createdAt
        ? new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs
        : undefined;

    if (recordingStartTime === undefined) return EMPTY_MARKERS;

    const durationSec = recording.recordingDurationMs / 1000;

    return entries
      .filter((entry) => entry.type === 'error')
      .map((entry) => {
        const timeSec = Math.min(
          durationSec,
          Math.max(0, (entry.timestamp - recordingStartTime) / 1000)
        );
        const label =
          entry.args.length > 0
            ? formatSerializedValue(entry.args[0]).slice(0, 120)
            : 'Console error';

        return { time: timeSec, label, color: '#ef4444' } satisfies VideoMarker;
      });
  }, [entries, recording]);
}
