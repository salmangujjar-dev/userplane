import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function useMediaBreakpoint(breakpoint: number) {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [breakpoint]
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < breakpoint,
    // No viewport on the server; match the previous first-render value.
    () => false
  );
}

// Below md breakpoint (768px) -- phones
export function useIsMobile() {
  return useMediaBreakpoint(MOBILE_BREAKPOINT);
}

// Below lg breakpoint (1024px) -- phones and tablets
export function useIsTablet() {
  return useMediaBreakpoint(TABLET_BREAKPOINT);
}
