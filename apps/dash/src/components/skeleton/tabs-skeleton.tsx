import { Skeleton } from '@workspace/ui/components/skeleton';

interface TabsSkeletonProps {
  tabCount?: number;
}

export function TabsSkeleton({ tabCount = 5 }: TabsSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: tabCount }, (_, i) => `tab-${i}`).map((id) => (
          <Skeleton key={id} className="h-10 w-24" />
        ))}
      </div>
      <div className="space-y-8">
        {Array.from({ length: 2 }, (_, i) => `section-${i}`).map((id) => (
          <div key={id} className="space-y-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <div className="rounded-lg p-6 space-y-4 bg-card">
              {Array.from({ length: 3 }, (_, i) => `inner-${i}`).map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
