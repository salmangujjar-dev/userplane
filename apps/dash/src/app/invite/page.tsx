'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';
import { useWorkspaceStore } from '@/stores/workspace';
import { useValidateInvite, useAcceptInvite } from '@/hooks/use-workspace-invite';
import { Loader2 } from 'lucide-react';
import { logger } from '@/logger';

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  const {
    data: inviteInfo,
    isLoading: isValidating,
    error: validationError,
  } = useValidateInvite(token);

  const { mutate: acceptInvite, isPending: isAccepting } = useAcceptInvite();

  const handleJoinWorkspace = () => {
    if (!inviteInfo || !token) return;

    logger.info(
      {
        workspaceId: inviteInfo.workspaceId,
        workspaceName: inviteInfo.workspaceName,
      },
      'Accepting workspace invite'
    );

    acceptInvite(
      {
        workspaceId: inviteInfo.workspaceId,
        token,
      },
      {
        onSuccess: (result) => {
          logger.info(
            {
              workspaceId: result.workspaceId,
              workspaceName: result.workspaceName,
            },
            'Successfully joined workspace'
          );
          setWorkspaceStore(result.workspaceId);
          router.push(`/${result.workspaceId}`);
        },
        onError: (error) => {
          logger.error({ err: error }, 'Failed to accept invite');
        },
      }
    );
  };

  if (!token || validationError) {
    if (!token) {
      logger.error('No invite token provided in URL');
    } else {
      logger.error({ err: validationError }, 'Invite validation failed');
    }

    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />
        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo showText={false} />
            <h1 className="text-xl font-medium text-foreground">Invalid Invite</h1>
            <p className="text-sm text-muted-foreground text-center">
              This invite link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <div className="space-y-6">
            <Button
              onClick={() => router.push('/')}
              size="lg"
              variant="secondary"
              className="w-full rounded-full px-7 py-6"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
        <AuthIcons />
        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo showText={false} />
            <h1 className="text-xl font-medium text-foreground">Validating invite</h1>
            <div className="flex items-center justify-center pt-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return null;
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
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
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageContent />
    </Suspense>
  );
}
