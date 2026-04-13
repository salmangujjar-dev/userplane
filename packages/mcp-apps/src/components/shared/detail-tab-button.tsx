import type { ReactNode } from 'react';

import { cn } from '../../utils';

/** Compact underline tab button used inside expanded log rows. */
export function DetailTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'text-xs pb-2 capitalize transition-colors cursor-pointer',
        active
          ? 'text-foreground border-b-2 border-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
