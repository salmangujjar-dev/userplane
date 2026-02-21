import { Skeleton } from '@workspace/ui/components/skeleton';

interface DetailedListSkeletonProps {
  count?: number;
  hasAction?: boolean;
}

export function DetailedListSkeleton({ count = 3, hasAction = false }: DetailedListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => `item-${i}`).map((id) => (
        <div key={id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <Skeleton className="h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          {hasAction && <Skeleton className="h-7 w-7 shrink-0" />}
        </div>
      ))}
    </div>
  );
}
