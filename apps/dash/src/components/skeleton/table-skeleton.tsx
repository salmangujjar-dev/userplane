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
          {Array.from({ length: columns }, (_, i) => `col-${i}`).map((id) => (
            <Skeleton key={id} className="h-5 w-24" />
          ))}
        </div>
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }, (_, i) => `row-${i}`).map((rowId) => (
          <div key={rowId} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }, (_, i) => `${rowId}-cell-${i}`).map((id) => (
              <Skeleton key={id} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
