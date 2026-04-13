import { useMemo } from 'react';

import type { VideoMarker } from '@/components/player/types';
import { useNetworkLogData, useRecordingNetworkLog } from '@/features/recordings';
import type { RecordingDetail } from '@/types';

const EMPTY_MARKERS: VideoMarker[] = [];

/**
 * Generates red VideoMarker dots on the seek bar for each failed network request
 * in the recording (status >= 400).
 *
 * Uses the same React Query keys as RecordingLogReplayPanel, so data is deduplicated —
 * no extra network requests when both the Network tab and the seek bar are visible.
 *
 * @param workspaceId - Workspace ID, or null for the shared recording page
 * @param recordingId - Recording ID
 * @param recording - Recording detail (may be undefined while loading)
 * @param networkLogUrl - Optional direct URL (shared page already has it)
 */
export function useNetworkErrorMarkers(
  workspaceId: string | null,
  recordingId: string,
  recording: RecordingDetail | undefined,
  networkLogUrl?: string
): VideoMarker[] {
  const networkLogResource = useRecordingNetworkLog(workspaceId, recordingId);
  const resourceUrl = networkLogResource.data?.success
    ? networkLogResource.data.data.resource.url
    : null;

  const url = networkLogUrl ?? resourceUrl ?? undefined;

  const { data: entries } = useNetworkLogData(workspaceId ?? recordingId, recordingId, url);

  return useMemo(() => {
    if (!entries || !recording) return EMPTY_MARKERS;

    const recordingStartTime = recording.recordingStartedAt
      ? new Date(recording.recordingStartedAt).getTime()
      : recording.meta.createdAt
        ? new Date(recording.meta.createdAt).getTime() - recording.recordingDurationMs
        : undefined;

    if (recordingStartTime === undefined) return EMPTY_MARKERS;

    const durationSec = recording.recordingDurationMs / 1000;

    return entries
      .filter((entry) => typeof entry.status === 'number' && entry.status >= 400)
      .map((entry) => {
        const timeSec = Math.min(
          durationSec,
          Math.max(0, (entry.timestamp - recordingStartTime) / 1000)
        );
        const label = `${entry.method} ${entry.url} ${entry.status}`.slice(0, 120);

        return {
          time: timeSec,
          label,
          color: '#ef4444',
          kind: 'network',
          entryTimestamp: entry.timestamp,
        } satisfies VideoMarker;
      });
  }, [entries, recording]);
}
