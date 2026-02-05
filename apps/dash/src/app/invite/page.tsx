'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { useAcceptInvite, useValidateInvite } from '@/features/workspace';
import { mediaClient } from '@/lib/media';
import { logger } from '@/logger';
import { useWorkspaceStore } from '@/stores/workspace';

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
    </div>
  );
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  const {
    data: inviteResult,
    isLoading: isValidating,
    error: validationError,
  } = useValidateInvite(token);
  const inviteInfo = inviteResult?.success ? inviteResult.data : null;

  const { mutate: acceptInvite, isPending: isAccepting } = useAcceptInvite();

  const handleJoinWorkspace = () => {
    if (!inviteInfo || !token) return;

    acceptInvite(
      {
        workspaceId: inviteInfo.workspaceId,
        token,
      },
      {
        onSuccess: (result) => {
          // Error already handled by mutation's onSuccess
          if (!result.success) return;

          const logMessage = result.data.alreadyMember
            ? 'User is already a member, redirecting'
            : 'Successfully joined workspace';

          logger.info({ workspaceId: result.data.workspaceId }, logMessage);
          setWorkspaceStore(result.data.workspaceId);
          router.push(`/${result.data.workspaceId}`);
        },
        onError: (error) => {
          logger.error({ err: error }, 'Failed to accept invite');
        },
      }
    );
  };

  if (!token || validationError || (inviteResult && !inviteResult.success)) {
    logger.error(
      !token
        ? 'No invite token provided'
        : validationError
          ? { err: validationError }
          : inviteResult && !inviteResult.success
            ? { code: inviteResult.error.code, message: inviteResult.error.message }
            : 'Unknown validation error',
      'Invalid invite attempt'
    );

    return (
      <InviteLayout>
        <div className="flex flex-col items-center gap-3">
          <Image
            src={mediaClient.icons.get('dino')}
            alt="Dino"
            width={120}
            height={120}
            unoptimized
            className="mb-2"
          />
          <h1 className="text-xl font-medium text-foreground">Invalid Invite</h1>
          <p className="text-sm text-muted-foreground text-center">
            {inviteResult && !inviteResult.success
              ? inviteResult.error.message
              : 'This invite link is invalid or has expired. Please request a new one.'}
          </p>
        </div>
        <div className="space-y-6">
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Go to Dashboard
          </Button>
        </div>
      </InviteLayout>
    );
  }

  if (isValidating) {
    return (
      <InviteLayout>
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">Validating invite</h1>
          <div className="flex items-center justify-center pt-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </div>
      </InviteLayout>
    );
  }

  if (!inviteInfo) {
    return null;
  }

  return (
    <InviteLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Join {inviteInfo.workspaceName}</h1>
        <p className="text-sm text-muted-foreground text-center">
          {inviteInfo.invitedByName} has invited you to join this workspace
        </p>
      </div>

      <div className="space-y-6">
        <Button
          onClick={handleJoinWorkspace}
          disabled={isAccepting}
          size="lg"
          className="w-full rounded-full px-7 py-6"
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining Workspace...
            </>
          ) : (
            'Join Workspace'
          )}
        </Button>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isAccepting}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </InviteLayout>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageContent />
    </Suspense>
  );
}
