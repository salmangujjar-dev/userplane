import { Separator } from '@userplane/ui/components/separator';
import { Skeleton } from '@userplane/ui/components/skeleton';

interface PageHeaderSkeletonProps {
  showDescription?: boolean;
}

export function PageHeaderSkeleton({ showDescription = true }: PageHeaderSkeletonProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-5 w-32" />
          {showDescription && <Skeleton className="h-3.5 w-48" />}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}
