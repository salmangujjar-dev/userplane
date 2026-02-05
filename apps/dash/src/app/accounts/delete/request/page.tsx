'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from '@workspace/ui/components/sonner';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authClient } from '@/client';
import { AuthIcons } from '@/components/auth/auth-icons';
import { useAccount } from '@/features/account';
import { useWorkspaceCount } from '@/features/workspace';
import { useAuth } from '@/hooks/use-auth';
import { mediaClient } from '@/lib/media';
import { logger } from '@/logger';

function RequestDeleteHeader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <Logo size="md" showText={false} />
      </Link>
      <h1 className="text-xl font-medium text-foreground">Delete your account</h1>
      <p className="text-sm text-muted-foreground text-center">
        This will permanently delete your account and all data
      </p>
    </div>
  );
}

function RequestDeleteSuccess({ email }: { email: string }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <Link href="/">
            <Logo size="md" showText={false} />
          </Link>
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestDeleteContent() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { data: accountResult, isLoading: isLoadingAccount } = useAccount();
  const { data: workspaceCountResult, isLoading: isLoadingWorkspaceCount } = useWorkspaceCount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;
  const workspaceCount = workspaceCountResult?.success ? workspaceCountResult.data.count : 0;
  const isLoading = isLoadingAccount || isLoadingWorkspaceCount;

  const handleRequestDeletion = async () => {
    try {
      setIsRequesting(true);
      logger.info('Initiating account deletion request');

      const result = await authClient.deleteUser({
        callbackURL: '/goodbye',
      });

      if (result.error) {
        logger.error({ err: result.error }, 'Account deletion request failed');
        toast.error('Failed to send deletion email', {
          description: result.error.message || 'Please try again later.',
        });
        return;
      }

      logger.info('Account deletion email sent successfully');
      setIsSuccess(true);
      toast.success('Check your email for the confirmation link');
    } catch (err) {
      logger.error({ err }, 'Account deletion request failed with exception');
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      toast.error('Failed to send deletion email', {
        description: errorMessage,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const handleViewWorkspaces = () => {
    router.push('/');
  };

  if (isSuccess) {
    return <RequestDeleteSuccess email={account?.userEmail || 'your email'} />;
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo size="md" showText={false} />
            </Link>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user still has workspaces
  if (workspaceCount > 0) {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
        <AuthIcons />

        {account && (
          <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Not {account.userName}?</span>
              <button onClick={signOut} className="text-foreground hover:underline font-medium">
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Link href="/">
              <Logo size="md" showText={false} />
            </Link>
            <h1 className="text-xl font-medium text-foreground">Account Still in a Workspace</h1>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Image
              src={mediaClient.icons.get('dino')}
              alt="Error"
              width={120}
              height={120}
              unoptimized
              className="opacity-80"
            />
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                You must leave all workspaces before deleting your account. You are currently a
                member of {workspaceCount} workspace(s).
              </p>
            </div>
          </div>

          <Button onClick={handleViewWorkspaces} size="lg" className="w-full rounded-full px-6">
            View My Workspaces
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && (
        <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Not {account.userName}?</span>
            <button onClick={signOut} className="text-foreground hover:underline font-medium">
              Sign out
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <RequestDeleteHeader />

        <div className="space-y-6">
          <div className="flex justify-center">
            <Image
              src={mediaClient.icons.get('dino')}
              alt="Dino"
              width={120}
              height={120}
              unoptimized
              className="opacity-80"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCancel}
              disabled={isRequesting}
              variant="default"
              size="lg"
              className="w-full rounded-full px-6"
            >
              Cancel
            </Button>

            <Button
              onClick={handleRequestDeletion}
              disabled={isRequesting}
              variant="secondary"
              size="lg"
              className="w-full rounded-full px-6"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Request Deletion'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestDeleteAccountPage() {
  return <RequestDeleteContent />;
}
