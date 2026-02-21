import { Skeleton } from '@workspace/ui/components/skeleton';

interface SidebarProjectsSkeletonProps {
  count?: number;
}

export function SidebarProjectsSkeleton({ count = 3 }: SidebarProjectsSkeletonProps) {
  return (
    <div className="space-y-1">
      {[...Array(count)].map((_, i) => (
        <div key={`project-${i}`} className="flex items-center gap-2 px-0 py-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
