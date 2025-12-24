import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';
import { Skeleton } from '@workspace/ui/components/skeleton';

export default function CreateWorkspaceLoading() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <Skeleton className="h-7 w-72" />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-14 w-full rounded-full" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
