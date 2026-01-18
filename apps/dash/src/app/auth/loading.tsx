import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import Link from 'next/link';

import { AuthIcons } from '@/components/auth/auth-icons';

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-80 mx-auto" />
      </div>
    </div>
  );
}
