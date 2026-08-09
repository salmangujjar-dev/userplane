import { useCallback, useSyncExternalStore } from 'react';

/**
 * Returns the elapsed time in whole seconds since `startedAt`.
 * Updates every second via setInterval. Returns 0 when startedAt is null.
 */
export function useElapsedTime(startedAt: number | null): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (startedAt === null) return () => {};
      const id = setInterval(onStoreChange, 1000);
      return () => clearInterval(id);
    },
    [startedAt]
  );

  // Read straight from the clock rather than mirroring it into state: the value
  // only changes once a second, so React re-renders exactly when it ticks.
  // (Clamped to 0 for clock-skew safety.)
  return useSyncExternalStore(
    subscribe,
    () => (startedAt === null ? 0 : Math.max(0, Math.floor((Date.now() - startedAt) / 1000))),
    () => 0
  );
}
