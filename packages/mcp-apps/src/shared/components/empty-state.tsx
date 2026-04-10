import type { ReactNode, SVGProps } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: (props: SVGProps<SVGSVGElement>) => ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && <Icon className="size-10 text-muted-foreground/40 mb-4" />}
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
    </div>
  );
}
