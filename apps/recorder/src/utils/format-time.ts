/**
 * Format elapsed seconds as m:ss (e.g. 0:00, 1:23, 12:05).
 */
export function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
