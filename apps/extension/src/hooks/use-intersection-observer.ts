import { useCallback, useRef } from 'react';

export function useIntersectionObserver(options: {
  onIntersect: () => void;
  enabled?: boolean;
  rootMargin?: string;
}): (node: HTMLElement | null) => void {
  const { onIntersect, enabled = true, rootMargin = '200px' } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !enabled) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onIntersect();
          }
        },
        { rootMargin }
      );

      observerRef.current.observe(node);
    },
    [onIntersect, enabled, rootMargin]
  );

  return sentinelRef;
}
