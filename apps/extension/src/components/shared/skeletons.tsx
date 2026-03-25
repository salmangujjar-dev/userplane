import { Skeleton } from '@userplane/ui/components/skeleton';

export function LinkPreviewSkeleton() {
  return (
    <div className="rounded-xl border border-border p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export function RecordingPreviewSkeleton() {
  return (
    <div className="rounded-lg p-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="pt-2 mt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-3.5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSwitcherSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function FormFieldSkeleton() {
  return <Skeleton className="h-12 w-full rounded-lg" />;
}
