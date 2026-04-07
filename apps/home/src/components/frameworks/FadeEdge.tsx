import { cn } from '@userplane/ui/lib/utils';

interface FadeEdgeProps {
  direction: 'top' | 'right' | 'bottom' | 'left';
  size?: string;
  className?: string;
}

const directionStyles: Record<
  FadeEdgeProps['direction'],
  { position: string; gradient: string; defaultSize: string }
> = {
  top: {
    position: 'inset-x-0 top-0',
    gradient: 'bg-gradient-to-b from-background to-transparent',
    defaultSize: 'h-[25%]',
  },
  right: {
    position: 'inset-y-0 right-0',
    gradient: 'bg-gradient-to-l from-background to-transparent',
    defaultSize: 'w-[35%]',
  },
  bottom: {
    position: 'inset-x-0 bottom-0',
    gradient: 'bg-gradient-to-t from-background to-transparent',
    defaultSize: 'h-[25%]',
  },
  left: {
    position: 'inset-y-0 left-0',
    gradient: 'bg-gradient-to-r from-background to-transparent',
    defaultSize: 'w-[35%]',
  },
};

export default function FadeEdge({ direction, size, className }: FadeEdgeProps) {
  const styles = directionStyles[direction];

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10',
        styles.position,
        styles.gradient,
        size ?? styles.defaultSize,
        className
      )}
    />
  );
}
