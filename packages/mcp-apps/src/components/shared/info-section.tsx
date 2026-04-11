import type { ReactNode } from 'react';

export function InfoSection({
  title,
  bordered = true,
  children,
}: {
  title: string;
  bordered?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={bordered ? 'border-t pt-6' : undefined}>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
