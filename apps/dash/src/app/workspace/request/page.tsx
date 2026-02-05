'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Check, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import {
  useApproveAccessRequest,
  useDeclineAccessRequest,
  useValidateAccessRequest,
} from '@/features/workspace';
import { mediaClient } from '@/lib/media';
import { logger } from '@/logger';

function AccessRequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
    </div>
  );
}

function AccessRequestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [actionComplete, setActionComplete] = useState<'approved' | 'declined' | null>(null);

  const {
    data: validateResult,
    isLoading: isValidating,
    error: validationError,
  } = useValidateAccessRequest(token);
  const requestInfo = validateResult?.success ? validateResult.data : null;

  const { mutate: approveRequest, isPending: isApproving } = useApproveAccessRequest();
  const { mutate: declineRequest, isPending: isDeclining } = useDeclineAccessRequest();

  const isProcessing = isApproving || isDeclining;

  const handleApprove = () => {
    if (!token) return;

    approveRequest(token, {
      onSuccess: (result) => {
        if (result.success) {
          logger.info({ workspaceId: result.data.workspaceId }, 'Access request approved');
          setActionComplete('approved');
        }
      },
      onError: (error) => {
        logger.error({ err: error }, 'Failed to approve access request');
      },
    });
  };

  const handleDecline = () => {
    if (!token) return;

    declineRequest(token, {
      onSuccess: (result) => {
        if (result.success) {
          logger.info({ workspaceId: result.data.workspaceId }, 'Access request declined');
          setActionComplete('declined');
        }
      },
      onError: (error) => {
        logger.error({ err: error }, 'Failed to decline access request');
      },
    });
  };

  // Show completion state
  if (actionComplete) {
    return (
      <AccessRequestLayout>
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">
            {actionComplete === 'approved' ? 'Access Granted' : 'Access Declined'}
          </h1>
          <p className="text-sm text-muted-foreground text-center flex items-center gap-2 flex-wrap justify-center">
            <span>Requesting access to</span>
            <Link
              href={`/workspace/${requestInfo?.workspaceId}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <strong className="underline underline-offset-2 decoration-muted-foreground group-hover:decoration-foreground">
                {requestInfo?.workspaceName}
              </strong>
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-8 p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <BoringAvatar
                name={requestInfo?.requesterName || requestInfo?.requesterEmail || 'User'}
                size={40}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {requestInfo?.requesterName || requestInfo?.requesterEmail}
                </span>
                {requestInfo?.requesterName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {requestInfo?.requesterEmail}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
                {actionComplete === 'approved' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {actionComplete === 'approved' ? 'Approved' : 'Declined'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href={`/workspace/${requestInfo?.workspaceId}/settings?tab=team`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go to workspace
            </Link>
          </div>
        </div>
      </AccessRequestLayout>
    );
  }

  // Show error state
  if (!token || validationError || (validateResult && !validateResult.success)) {
    logger.error(
      !token
        ? 'No access request token provided'
        : validationError
          ? { err: validationError }
          : validateResult && !validateResult.success
            ? { code: validateResult.error.code, message: validateResult.error.message }
            : 'Unknown validation error',
      'Invalid access request'
    );

    return (
      <AccessRequestLayout>
        <div className="flex flex-col items-center gap-3">
          <Image
            src={mediaClient.icons.get('dino')}
            alt="Dino"
            width={120}
            height={120}
            unoptimized
            className="mb-2"
          />
          <h1 className="text-xl font-medium text-foreground">Invalid Request</h1>
          <p className="text-sm text-muted-foreground text-center">
            {validateResult && !validateResult.success
              ? validateResult.error.message
              : 'This access request link is invalid or has expired.'}
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        </div>
      </AccessRequestLayout>
    );
  }

  // Show loading state
  if (isValidating) {
    return (
      <AccessRequestLayout>
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-8 p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-2 min-w-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </AccessRequestLayout>
    );
  }

  if (!requestInfo) {
    return null;
  }

  // Show review state
  return (
    <AccessRequestLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Access Request</h1>
        <p className="text-sm text-muted-foreground text-center flex items-center gap-2 flex-wrap justify-center">
          <span>Requesting access to</span>
          <Link
            href={`/workspace/${requestInfo.workspaceId}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
          >
            <strong className="underline underline-offset-2 decoration-muted-foreground group-hover:decoration-foreground">
              {requestInfo.workspaceName}
            </strong>
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-8 p-6 rounded-xl border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <BoringAvatar
              name={requestInfo.requesterName || requestInfo.requesterEmail}
              size={40}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {requestInfo.requesterName || requestInfo.requesterEmail}
              </span>
              {requestInfo.requesterName && (
                <span className="text-xs text-muted-foreground truncate">
                  {requestInfo.requesterEmail}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full h-8 w-8 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0"
              onClick={handleDecline}
              disabled={isProcessing}
            >
              {isDeclining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href={`/workspace/${requestInfo.workspaceId}/settings?tab=team`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to workspace
          </Link>
        </div>
      </div>
    </AccessRequestLayout>
  );
}

export default function AccessRequestPage() {
  return (
    <Suspense fallback={null}>
      <AccessRequestPageContent />
    </Suspense>
  );
}
