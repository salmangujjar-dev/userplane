import { Skeleton } from '@workspace/ui/components/skeleton';

interface PageHeaderSkeletonProps {
  showFilters?: boolean;
  filterCount?: number;
}

export function PageHeaderSkeleton({
  showFilters = false,
  filterCount = 3,
}: PageHeaderSkeletonProps) {
  return (
    <div className="mb-6">
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
      {showFilters && (
        <div className="flex items-center gap-2 -ml-2.5 mt-3">
          {[...Array(filterCount)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      )}
    </div>
  );
}
