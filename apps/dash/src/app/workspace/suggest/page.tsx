'use client';

import { WORKSPACE_SUGGESTIONS_PAGINATION } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Globe, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useWorkspaceSuggestions } from '@/hooks/use-workspace-suggestions';
import { logger } from '@/logger';
import { useJoinWorkspace } from '@/queries/use-workspace-mutations';

const ITEMS_PER_PAGE = WORKSPACE_SUGGESTIONS_PAGINATION.DEFAULT_PER_PAGE;

function WorkspaceSuggestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
    </div>
  );
}

function WorkspaceSuggestPageContent() {
  const router = useRouter();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestedWorkspace, setRequestedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);

  const {
    data: suggestionsData,
    isLoading,
    error,
  } = useWorkspaceSuggestions({ page: currentPage, perPage: ITEMS_PER_PAGE });

  const joinMutation = useJoinWorkspace({
    onSuccess: (status) => {
      if (status === 'joined') {
        logger.info({ workspaceId: selectedWorkspaceId }, 'Successfully joined workspace');
        router.push('/');
        router.refresh();
      } else if (status === 'requested') {
        logger.info({ workspaceId: selectedWorkspaceId }, 'Access request sent');
        // Find the workspace name
        const workspace = suggestionsData?.data?.workspaces.find(
          (w) => w.workspaceId === selectedWorkspaceId
        );
        if (workspace) {
          setRequestedWorkspace({
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.workspaceName,
          });
        }
      }
      setIsJoining(false);
    },
  });

  useEffect(() => {
    if (isLoading) return;

    if (!suggestionsData?.success || suggestionsData.data.workspaces.length === 0) {
      logger.info('No workspace suggestions available, redirecting to create workspace');
      router.push('/workspace/create');
    } else if (suggestionsData.data.workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(suggestionsData.data.workspaces[0]?.workspaceId ?? null);
    }
  }, [isLoading, suggestionsData, router, selectedWorkspaceId]);

  const handleJoinWorkspace = () => {
    if (!selectedWorkspaceId) return;
    setIsJoining(true);
    joinMutation.mutate(selectedWorkspaceId);
  };

  if (isLoading) {
    return (
      <WorkspaceSuggestLayout>
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <div className="flex -space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-6 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <div className="flex -space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                  <Skeleton className="h-6 w-6 rounded-full border-2 border-card" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
              </div>
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-full" />

          <div className="flex justify-center pt-2">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </WorkspaceSuggestLayout>
    );
  }

  if (error || (suggestionsData && !suggestionsData.success)) {
    logger.error(
      error
        ? { err: error }
        : suggestionsData && !suggestionsData.success
          ? { code: suggestionsData.error.code, message: suggestionsData.error.message }
          : 'Unknown error',
      'Failed to load workspace suggestions'
    );

    return (
      <WorkspaceSuggestLayout>
        <div className="flex flex-col items-center gap-3">
          <Image src="/assets/dino.svg" alt="Dino" width={120} height={120} className="mb-2" />
          <h1 className="text-xl font-medium text-foreground">Unable to Load Suggestions</h1>
          <p className="text-sm text-muted-foreground text-center">
            {suggestionsData && !suggestionsData.success
              ? suggestionsData.error.message
              : 'Something went wrong while loading workspace suggestions.'}
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/workspace/create')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Create Workspace
          </button>
        </div>
      </WorkspaceSuggestLayout>
    );
  }

  if (!suggestionsData?.success || suggestionsData.data.workspaces.length === 0) {
    return null;
  }

  const selectedWorkspace = suggestionsData.data.workspaces.find(
    (w) => w.workspaceId === selectedWorkspaceId
  );
  const isRequestAccess = selectedWorkspace?.action === 'request';

  // Show success state when access has been requested
  if (requestedWorkspace) {
    const avatarNames = [
      `${requestedWorkspace.workspaceName}-member-1`,
      `${requestedWorkspace.workspaceName}-member-2`,
      `${requestedWorkspace.workspaceName}-member-3`,
    ];

    return (
      <WorkspaceSuggestLayout>
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">Access Requested</h1>
        </div>

        <div className="w-full p-6 rounded-xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex -space-x-2 shrink-0 cursor-default">
                  {avatarNames.map((name, index) => (
                    <div key={index} className="rounded-full border-2 border-card overflow-hidden">
                      <BoringAvatar name={name} size={28} />
                    </div>
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs">Workspace members</span>
              </TooltipContent>
            </Tooltip>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium text-foreground">
                You&apos;ve requested access to <strong>{requestedWorkspace.workspaceName}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                We&apos;ll notify you as soon as your request is approved
              </p>
            </div>
          </div>
        </div>
      </WorkspaceSuggestLayout>
    );
  }

  return (
    <WorkspaceSuggestLayout>
      <div className="flex flex-col items-center gap-3">
        <Logo showText={false} />
        <h1 className="text-xl font-medium text-foreground">Suggested Workspaces</h1>
        <p className="text-sm text-muted-foreground text-center">
          Join an existing workspace or create a new one
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {suggestionsData.data.workspaces.map((workspace) => {
            const isSelected = selectedWorkspaceId === workspace.workspaceId;
            const avatarNames = [
              `${workspace.workspaceName}-member-1`,
              `${workspace.workspaceName}-member-2`,
              `${workspace.workspaceName}-member-3`,
            ];
            const PolicyIcon = workspace.workspaceInvitePolicy === 'protected' ? Shield : Globe;
            const policyLabel =
              workspace.workspaceInvitePolicy === 'protected'
                ? 'Approval required'
                : 'Open to your domain';

            return (
              <div
                key={workspace.workspaceId}
                onClick={() => setSelectedWorkspaceId(workspace.workspaceId)}
                className={`flex items-center justify-between p-6 rounded-xl border bg-card cursor-pointer transition-all ${
                  isSelected
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-foreground' : 'border-muted-foreground'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-foreground" />}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex -space-x-2 shrink-0 cursor-pointer">
                        {avatarNames.map((name, index) => (
                          <div
                            key={index}
                            className="rounded-full border-2 border-card overflow-hidden"
                          >
                            <BoringAvatar name={name} size={24} />
                          </div>
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">Workspace members</span>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {workspace.workspaceName}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <PolicyIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">{policyLabel}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {suggestionsData.data.pagination.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={suggestionsData.data.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        <Button
          onClick={handleJoinWorkspace}
          disabled={!selectedWorkspaceId || isJoining}
          size="lg"
          className="w-full rounded-full px-7 py-6"
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRequestAccess ? 'Requesting Access...' : 'Joining Workspace...'}
            </>
          ) : isRequestAccess ? (
            'Request Access'
          ) : (
            'Join Workspace'
          )}
        </Button>

        <div className="flex justify-center">
          <Link
            href="/workspace/create"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Create Workspace
          </Link>
        </div>
      </div>
    </WorkspaceSuggestLayout>
  );
}

export default function WorkspaceSuggestPage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceSuggestPageContent />
    </Suspense>
  );
}
