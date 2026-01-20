/**
 * Formatting utility functions
 */

/**
 * Format duration from milliseconds to mm:ss format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format date for submission display
 * @param date - Date to format
 * @returns Formatted date string (e.g., "January 19, 2026 at 2:30 PM")
 */
export function formatSubmittedAt(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format deletion date for email notifications
 * @param date - Date to format
 * @returns Formatted date string (e.g., "January 19, 2026")
 */
export function formatDeletionDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
