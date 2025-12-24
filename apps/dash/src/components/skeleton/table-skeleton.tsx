import { Skeleton } from '@workspace/ui/components/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg overflow-hidden bg-card">
      <div className="bg-muted/50">
        <div className="flex items-center gap-4 p-4">
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-24" />
          ))}
        </div>
      </div>
      <div className="space-y-0">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {[...Array(columns)].map((_, j) => (
              <Skeleton key={j} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
