import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function useMediaBreakpoint(breakpoint: number) {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsBelow(window.innerWidth < breakpoint);
    };
    mql.addEventListener('change', onChange);
    setIsBelow(window.innerWidth < breakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return !!isBelow;
}

// Below md breakpoint (768px) -- phones
export function useIsMobile() {
  return useMediaBreakpoint(MOBILE_BREAKPOINT);
}

// Below lg breakpoint (1024px) -- phones and tablets
export function useIsTablet() {
  return useMediaBreakpoint(TABLET_BREAKPOINT);
}
