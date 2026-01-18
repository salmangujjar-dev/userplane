import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';

import { AuthIcons } from '@/components/auth/auth-icons';

export default function RestoreLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />
      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="w-full p-6 rounded-xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="w-full space-y-3">
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-5 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}
