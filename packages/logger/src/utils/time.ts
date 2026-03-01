/**
 * Returns the current timestamp in client time.
 * Server-client clock delta is applied centrally at upload time, not here.
 */
export function now(): number {
  return Date.now();
}
