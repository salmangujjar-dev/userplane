'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ArrowLeft, Globe, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { useJoinWorkspace, useWorkspaceStatus } from '@/features/workspace';
import { mediaClient } from '@/lib/media';
import type { WorkspaceInvitePolicy } from '@/types';

interface WorkspaceAccessGateProps {
  children: React.ReactNode;
}

/**
 * Gate component that wraps workspace pages
 * Shows appropriate UI based on user's access status to the workspace
 */
export function WorkspaceAccessGate({ children }: WorkspaceAccessGateProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { data: statusResult, isLoading, error } = useWorkspaceStatus(workspaceId);

  const [requestedWorkspace, setRequestedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);

  const joinMutation = useJoinWorkspace({
    onSuccess: (status) => {
      if (status === 'joined') {
        // Refresh the page to reload with member access
        router.refresh();
      } else if (status === 'requested' && statusResult?.success) {
        // Show the "access requested" confirmation
        setRequestedWorkspace({
          workspaceId: statusResult.data.workspaceId,
          workspaceName: statusResult.data.workspaceName,
        });
      }
    },
  });

  // Loading state
  if (isLoading) {
    return <WorkspaceAccessLoading />;
  }

  // Error state (network error or API error) - show 404
  const hasError = error || (statusResult && !statusResult.success);
  if (hasError) {
    return <WorkspaceAccessDenied onGoBack={() => router.push('/')} />;
  }

  // No data - shouldn't happen but handle gracefully
  if (!statusResult?.data) {
    return <WorkspaceAccessDenied onGoBack={() => router.push('/')} />;
  }

  const { isDeleted, accessStatus, workspaceName, invitePolicy } = statusResult.data;

  // Deleted workspace - show "gone" state
  if (isDeleted) {
    return <WorkspaceAccessDeleted onGoBack={() => router.push('/')} />;
  }

  // Show "access requested" confirmation if user just requested access
  if (requestedWorkspace) {
    return <WorkspaceAccessRequested workspaceName={requestedWorkspace.workspaceName} />;
  }

  // No access (private or domain mismatch) - show 404
  if (accessStatus === 'no_access') {
    return <WorkspaceAccessDenied onGoBack={() => router.push('/')} />;
  }

  // Can join directly (whitelisted + domain match)
  if (accessStatus === 'can_join') {
    return (
      <WorkspaceAccessJoin
        workspaceName={workspaceName}
        invitePolicy={invitePolicy}
        onJoin={() => joinMutation.mutate(workspaceId)}
        isJoining={joinMutation.isPending}
      />
    );
  }

  // Can request access (protected + domain match)
  if (accessStatus === 'can_request') {
    return (
      <WorkspaceAccessRequest
        workspaceName={workspaceName}
        invitePolicy={invitePolicy}
        onRequestAccess={() => joinMutation.mutate(workspaceId)}
        isRequesting={joinMutation.isPending}
      />
    );
  }

  // Member - render children
  return <>{children}</>;
}

/**
 * Layout wrapper for access gate UI states
 */
function WorkspaceAccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">{children}</div>
    </div>
  );
}

/**
 * Loading skeleton while checking access
 */
function WorkspaceAccessLoading() {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="w-full p-6 rounded-xl bg-card">
        <div className="flex flex-col items-center gap-3">
          <div className="flex -space-x-2">
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-12 w-full animate-pulse rounded-full bg-muted" />
    </WorkspaceAccessLayout>
  );
}

/**
 * Workspace card with avatars and policy indicator
 */
function WorkspaceCard({
  workspaceName,
  invitePolicy,
}: {
  workspaceName: string;
  invitePolicy: WorkspaceInvitePolicy | null;
}) {
  const getPolicyLabel = () => {
    switch (invitePolicy) {
      case 'whitelisted':
        return { icon: Globe, label: 'Open to your domain' };
      case 'protected':
        return { icon: Shield, label: 'Approval required' };
      default:
        return null;
    }
  };

  const policyInfo = getPolicyLabel();

  return (
    <div className="w-full p-6 rounded-xl bg-card">
      <div className="flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex -space-x-2 shrink-0 cursor-default">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-full border-2 border-card overflow-hidden">
                  <BoringAvatar size={AVATAR_SIZES.GROUP} />
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">{workspaceName} workspace</span>
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
          {policyInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <policyInfo.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs">{policyInfo.label}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 404-style page for denied access (private or domain mismatch)
 * Intentionally vague to prevent workspace enumeration
 */
function WorkspaceAccessDenied({ onGoBack }: { onGoBack?: () => void }) {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <Image
          src={mediaClient.getIconMediaUrl('icons/dino.svg')}
          alt="Not Found"
          width={120}
          height={120}
          className="mb-2"
        />
        <h1 className="text-xl font-medium text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground text-center">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      {onGoBack && (
        <Button onClick={onGoBack} size="lg" className="rounded-full px-7 mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      )}
    </WorkspaceAccessLayout>
  );
}

/**
 * Message for soft-deleted workspaces
 */
function WorkspaceAccessDeleted({ onGoBack }: { onGoBack?: () => void }) {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <Image
          src={mediaClient.getIconMediaUrl('icons/dino.svg')}
          alt="Deleted"
          width={120}
          height={120}
          className="mb-2"
        />
        <h1 className="text-xl font-medium text-foreground">Workspace deleted</h1>
        <p className="text-sm text-muted-foreground text-center">
          This workspace has been deleted and is no longer accessible.
        </p>
      </div>
      {onGoBack && (
        <Button onClick={onGoBack} size="lg" className="rounded-full px-7 mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      )}
    </WorkspaceAccessLayout>
  );
}

/**
 * Join workspace UI for whitelisted workspaces
 */
function WorkspaceAccessJoin({
  workspaceName,
  invitePolicy,
  onJoin,
  isJoining,
}: {
  workspaceName: string;
  invitePolicy: WorkspaceInvitePolicy | null;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Join Workspace</h1>
        <p className="text-sm text-muted-foreground text-center">
          You can join this workspace to access its content
        </p>
      </div>

      <WorkspaceCard workspaceName={workspaceName} invitePolicy={invitePolicy} />

      <Button
        onClick={onJoin}
        disabled={isJoining}
        size="lg"
        className="w-full rounded-full px-7 py-6"
      >
        {isJoining ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining Workspace...
          </>
        ) : (
          'Join Workspace'
        )}
      </Button>
    </WorkspaceAccessLayout>
  );
}

/**
 * Request access UI for protected workspaces
 */
function WorkspaceAccessRequest({
  workspaceName,
  invitePolicy,
  onRequestAccess,
  isRequesting,
}: {
  workspaceName: string;
  invitePolicy: WorkspaceInvitePolicy | null;
  onRequestAccess: () => void;
  isRequesting: boolean;
}) {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Request Access</h1>
        <p className="text-sm text-muted-foreground text-center">
          This workspace requires approval to join
        </p>
      </div>

      <WorkspaceCard workspaceName={workspaceName} invitePolicy={invitePolicy} />

      <Button
        onClick={onRequestAccess}
        disabled={isRequesting}
        size="lg"
        className="w-full rounded-full px-7 py-6"
      >
        {isRequesting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting Access...
          </>
        ) : (
          'Request Access'
        )}
      </Button>
    </WorkspaceAccessLayout>
  );
}

/**
 * Confirmation UI after access has been requested
 */
function WorkspaceAccessRequested({ workspaceName }: { workspaceName: string }) {
  return (
    <WorkspaceAccessLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Access Requested</h1>
      </div>

      <div className="w-full p-6 rounded-xl bg-card">
        <div className="flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex -space-x-2 shrink-0 cursor-default">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="rounded-full border-2 border-card overflow-hidden">
                    <BoringAvatar size={AVATAR_SIZES.GROUP} />
                  </div>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">{workspaceName} workspace</span>
            </TooltipContent>
          </Tooltip>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground">
              You&apos;ve requested access to <strong>{workspaceName}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              We&apos;ll notify you as soon as your request is approved
            </p>
          </div>
        </div>
      </div>
    </WorkspaceAccessLayout>
  );
}
