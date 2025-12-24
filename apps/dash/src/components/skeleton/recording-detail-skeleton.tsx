import { Skeleton } from '@workspace/ui/components/skeleton';

export function RecordingDetailSkeleton() {
  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="h-14 flex items-center px-6 gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="flex-1">
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <main className="w-full pl-4 overflow-hidden flex-1">
        <div className="h-full flex gap-4 pr-4">
          <div className="flex-2 space-y-4 py-4">
            <Skeleton className="w-full aspect-video rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <div className="flex-1 py-4 space-y-4">
            <div className="flex gap-2 pb-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded bg-card">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
