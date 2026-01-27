import { Skeleton } from '@workspace/ui/components/skeleton';

import { AuthIcons } from '@/components/auth/auth-icons';

export default function IntercomIntegrationCallbackLoading() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-14 w-14 rounded-xl" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
