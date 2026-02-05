'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { useVerifyBillingEmailChange } from '@/features/workspace';
import { mediaClient } from '@/lib/media';
import { logger } from '@/logger';

function BillingEmailVerificationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: verifyEmail } = useVerifyBillingEmailChange({
    onSuccess: (data) => {
      logger.info(
        { workspaceId: data.workspaceId, email: data.workspaceBillingEmail },
        'Billing email verified successfully'
      );
      setWorkspaceId(data.workspaceId);
      setVerificationState('success');
    },
    onError: () => {
      setVerificationState('error');
      setErrorMessage('Failed to verify billing email. The link may be invalid or expired.');
    },
  });

  useEffect(() => {
    if (!token) {
      logger.error('No billing email verification token provided');
      setVerificationState('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    verifyEmail({ token });
  }, [token, verifyEmail]);

  if (verificationState === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <AuthIcons />

        <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo showText={false} />
            <h1 className="text-xl font-medium text-foreground">Billing email updated</h1>
            <p className="text-sm text-muted-foreground text-center">
              Your billing email has been successfully changed. All workspace owners have been
              notified.
            </p>
          </div>

          <Button
            onClick={() =>
              workspaceId
                ? router.push(`/workspace/${workspaceId}/settings?tab=workspace`)
                : router.push('/')
            }
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Go to workspace settings
          </Button>
        </div>
      </div>
    );
  }

  if (verificationState === 'error') {
    return (
      <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
        <AuthIcons />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo showText={false} />
            <h1 className="text-xl font-medium text-foreground">Unable to verify billing email</h1>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Image
              src={mediaClient.getIconMediaUrl('icons/dino.svg')}
              alt="Error"
              width={120}
              height={120}
              unoptimized
              className="opacity-80"
            />
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                {errorMessage ||
                  'The verification link may have expired or already been used. Verification links expire after 10 minutes for security reasons.'}
              </p>
            </div>
          </div>

          <Button onClick={() => router.push('/')} size="lg" className="w-full rounded-full px-6">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying...</span>
        </div>
      </div>
    </div>
  );
}

export default function BillingEmailVerificationPage() {
  return (
    <Suspense fallback={null}>
      <BillingEmailVerificationPageContent />
    </Suspense>
  );
}
