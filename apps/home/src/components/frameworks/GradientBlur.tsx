import { cn } from '@userplane/ui/lib/utils';

interface GradientBlurProps {
  className?: string;
  blur?: number;
}

export default function GradientBlur({ className, blur = 100 }: GradientBlurProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute', className)}
      style={{
        background:
          'linear-gradient(90deg, var(--gradient-1) 0%, var(--gradient-2) 38%, var(--gradient-3) 71%, var(--gradient-4) 100%)',
        filter: `blur(${blur}px)`,
      }}
    />
  );
}
