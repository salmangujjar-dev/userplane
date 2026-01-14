/**
 * Time formatting utilities for video player controls
 */

/**
 * Format time for compact display in controls (e.g., "3:45")
 * Used for current time/duration displays in the player controls
 * @param seconds - Time in seconds
 * @returns Formatted time string in mm:ss format
 */
export function formatTimeCompact(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time for readable duration display (e.g., "3 min 45 s")
 * Used for video duration badges and overlays
 * @param seconds - Time in seconds
 * @returns Formatted duration string with units
 */
export function formatDurationReadable(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins} min ${secs} s`;
}
