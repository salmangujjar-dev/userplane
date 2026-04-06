'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@userplane/ui/components/accordion';
import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Suspense, useEffect, useState } from 'react';

import { authClient } from '@/client';
import { AuthIcons } from '@/components/auth/auth-icons';
import { DinoError } from '@/components/shared/dino-error';
import { useAccount } from '@/features/account';
import { useAuth } from '@/hooks/use-auth';
import { showAccountDeletedToast, showAccountDeletionFailedToast } from '@/lib/toasts';

function DeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
    </div>
  );
}

function DeleteAccountHeader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <Logo size="md" showText={false} />
      </Link>
      <h1 className="text-xl font-medium text-foreground">Delete your account</h1>
      <p className="text-sm text-muted-foreground">
        Deleting your account will permanently remove your data and cannot be undone
      </p>
    </div>
  );
}

function DeleteAccountSuccess() {
  return (
    <DeleteAccountLayout>
      <div className="flex flex-col items-center gap-6">
        <Link href="/">
          <Logo size="md" showText={false} />
        </Link>
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-xl font-medium text-foreground">Account deleted</h1>
          <p className="text-sm text-muted-foreground text-center">
            We&apos;re sorry to see you go
          </p>
        </div>
      </div>
    </DeleteAccountLayout>
  );
}

function DeleteAccountContent() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing deletion token. Please check your email and try again.');
    }
  }, [token]);

  const handleDelete = async () => {
    if (!token) {
      setError('Invalid or missing deletion token. Please check your email and try again.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      const result = await authClient.deleteUser({
        token,
      });

      if (result.error) {
        posthog.captureException(result.error, {
          error_boundary: 'account-delete',
          token,
        });
        setError(result.error.message || 'Failed to delete account. Please try again.');
        showAccountDeletionFailedToast(result.error.message);
        return;
      }

      setIsSuccess(true);
      showAccountDeletedToast();

      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      posthog.captureException(err, {
        error_boundary: 'account-delete',
        token,
      });
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      showAccountDeletionFailedToast(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const handleViewWorkspaces = () => {
    router.push('/');
  };

  if (isSuccess) {
    return <DeleteAccountSuccess />;
  }

  if (error && !token) {
    return (
      <DinoError
        title="Invalid Deletion Link"
        description={error}
        onGoBack={handleGoBack}
        showRetry={false}
      />
    );
  }

  // Check if error is related to workspace membership
  const isWorkspaceError = error && error.includes('workspace');

  if (isWorkspaceError) {
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
              src="/icons/dino.svg"
              alt="Error"
              width={120}
              height={120}
              className="opacity-80"
            />
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground text-center max-w-sm">{error}</p>
            </div>
          </div>

          <Button onClick={handleViewWorkspaces} size="lg" className="w-full px-6">
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

      <div className="w-full max-w-md space-y-6 relative z-10">
        <DeleteAccountHeader />

        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Deletion failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="account-data" className="border-b last:border-b-0">
              <AccordionTrigger>Account Data</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                All personal information including name, email, and profile details will be
                permanently removed from our systems.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="workspace-access" className="border-b last:border-b-0">
              <AccordionTrigger>Workspace Access</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                You will be removed from all workspaces. Any workspaces you own will need to be
                transferred or deleted separately.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recording-access" className="border-b last:border-b-0">
              <AccordionTrigger>Recording Access</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                Access to all recordings and session replays will be lost. Download any important
                recordings before deletion.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="link-access" className="border-b last:border-b-0">
              <AccordionTrigger>Link Access</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                All shared links and access tokens associated with your account will be invalidated
                immediately.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="project-access" className="border-b last:border-b-0">
              <AccordionTrigger>Project Access</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                You will lose access to all projects and associated data. Project ownership will
                need to be transferred first.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGoBack}
              disabled={isDeleting}
              variant="default"
              size="lg"
              className="w-full px-6"
            >
              Cancel
            </Button>

            <Button
              onClick={handleDelete}
              disabled={isDeleting || !token}
              variant="secondary"
              size="lg"
              className="w-full px-6"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DeleteAccountContent />
    </Suspense>
  );
}
