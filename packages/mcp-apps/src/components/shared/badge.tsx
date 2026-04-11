import type { ReactNode } from 'react';

import { cn } from '../../utils';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'destructive' && 'bg-destructive/10 text-destructive',
        className
      )}
    >
      {children}
    </span>
  );
}
