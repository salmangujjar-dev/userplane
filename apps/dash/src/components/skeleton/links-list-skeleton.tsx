import { Skeleton } from '@workspace/ui/components/skeleton';

interface LinksListSkeletonProps {
  count?: number;
}

export function LinksListSkeleton({ count = 10 }: LinksListSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={`link-${i}`} className="flex items-center justify-between p-4 rounded-lg bg-card">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-1/3" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
