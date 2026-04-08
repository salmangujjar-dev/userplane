import { cn } from '@userplane/ui/lib/utils';

interface GlassCardProps {
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export default function GlassCard({
  children,
  overlay,
  className,
  innerClassName,
}: GlassCardProps) {
  return (
    <div className={cn('relative select-none overflow-hidden rounded-2xl', className)}>
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white',
          innerClassName
        )}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}
