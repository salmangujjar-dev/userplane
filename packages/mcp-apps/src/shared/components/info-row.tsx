import type { ReactNode, SVGProps } from 'react';

import { cn } from '../utils';

export function InfoRow({
  icon: Icon,
  label,
  children,
  align = 'center',
}: {
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
  label: string;
  children: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={cn('grid grid-cols-[140px_1fr] gap-4 text-sm', align === 'start' && 'items-start')}
    >
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </span>
      {children}
    </div>
  );
}
