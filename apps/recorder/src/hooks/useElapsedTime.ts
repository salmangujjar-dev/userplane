import { useEffect, useState } from 'react';

/**
 * Returns the elapsed time in whole seconds since `startedAt`.
 * Updates every second via setInterval. Returns 0 when startedAt is null.
 */
export function useElapsedTime(startedAt: number | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(0);
      return;
    }

    // Compute initial value immediately (clamped to 0 for clock-skew safety)
    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
