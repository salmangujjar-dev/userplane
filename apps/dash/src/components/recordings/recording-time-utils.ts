/**
 * Shared utility for computing display timestamps relative to the recording start.
 * Used by console-log-entry, network-entry, and action-entry.
 */
export function getRecordingTime(eventTimestamp: number, recordingStartTime?: number): string {
  if (!recordingStartTime) return '00:00';
  const elapsed = Math.max(0, eventTimestamp - recordingStartTime);
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
