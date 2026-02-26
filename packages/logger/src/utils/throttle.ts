const NETWORK_THROTTLE_MS = 200;
const NAVIGATION_THROTTLE_MS = 200;
const MAX_MAP_SIZE = 500;

function pruneMap(map: Map<string, number>, throttleMs: number, now: number): void {
  if (map.size <= MAX_MAP_SIZE) return;
  for (const [key, ts] of map) {
    if (now - ts >= throttleMs) map.delete(key);
  }
}

// ─── Network Request Deduplication ──────────────────────────────────────────

const networkTimestamps = new Map<string, number>();

/**
 * Returns true if the network request should be logged (not throttled).
 * Uses a key like "fetch|GET|/api/data|200" to deduplicate rapid-fire identical requests.
 */
export function shouldLogNetwork(key: string): boolean {
  const now = performance.now();
  pruneMap(networkTimestamps, NETWORK_THROTTLE_MS, now);
  const lastTime = networkTimestamps.get(key) || 0;
  if (now - lastTime < NETWORK_THROTTLE_MS) {
    return false;
  }
  networkTimestamps.set(key, now);
  return true;
}

// ─── Navigation Event Deduplication ─────────────────────────────────────────

const navigationTimestamps = new Map<string, number>();

/**
 * Returns true if the navigation event should be forwarded (not throttled).
 * Deduplicates rapid-fire navigation events with the same method|from|to signature.
 */
export function shouldLogNavigation(method: string, from: string, to: string): boolean {
  const key = `${method}|${from}|${to}`;
  const now = performance.now();
  pruneMap(navigationTimestamps, NAVIGATION_THROTTLE_MS, now);
  const lastTime = navigationTimestamps.get(key) || 0;
  if (now - lastTime < NAVIGATION_THROTTLE_MS) {
    return false;
  }
  navigationTimestamps.set(key, now);
  return true;
}
