'use client';

import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { AlertTriangle, FolderKanban, Link2, Loader2, Users, Video } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Suspense, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { useProjectRestoreInfo, useRestoreProject } from '@/features/projects';
import { useRestoreWorkspace, useWorkspaceRestoreInfo } from '@/features/workspace';
import { mediaClient } from '@/lib/media';
import { useWorkspaceStore } from '@/stores/workspace';
import type { RestorationStatus } from '@/types';

type RestoreType = 'workspace' | 'project';

/**
 * Invalid parameters state component
 */
function InvalidParamsState({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Hmm, something&apos;s not right</h1>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Image
            src={mediaClient.getIconMediaUrl('icons/dino.svg')}
            alt="Error"
            width={120}
            height={120}
            className="opacity-80"
          />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              The restore link appears to be incomplete. Make sure you&apos;re using the full link
              from your deletion email.
            </p>
          </div>
        </div>

        <Button onClick={onGoToDashboard} size="lg" className="w-full px-6">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * Success state component
 */
function SuccessState({
  restoreType,
  restoredWorkspaceData,
  restoredProjectData,
  onGoToWorkspace,
}: {
  restoreType: RestoreType;
  restoredWorkspaceData: {
    workspaceId: string;
    workspaceName: string;
    restoredProjects: number;
    restoredLinks: number;
    restoredMembers: number;
    restoredRecordings: number;
    restorationStatus: RestorationStatus;
  } | null;
  restoredProjectData: {
    projectName: string;
    workspaceId: string;
    restoredLinks: number;
    restoredRecordings: number;
    restorationStatus: RestorationStatus;
  } | null;
  onGoToWorkspace: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">
            {restoreType === 'workspace' ? 'Workspace' : 'Project'} restored successfully
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Your {restoreType} has been restored and is now active
          </p>
        </div>

        {restoreType === 'workspace' && restoredWorkspaceData && (
          <WorkspaceCard
            workspaceId={restoredWorkspaceData.workspaceId}
            workspaceName={restoredWorkspaceData.workspaceName}
            projectsRestored={restoredWorkspaceData.restoredProjects}
            linksRestored={restoredWorkspaceData.restoredLinks}
            membersRestored={restoredWorkspaceData.restoredMembers}
            recordingsRestored={restoredWorkspaceData.restoredRecordings}
          />
        )}

        {restoreType === 'project' && restoredProjectData && (
          <ProjectCard
            projectName={restoredProjectData.projectName}
            linksRestored={restoredProjectData.restoredLinks}
            recordingsRestored={restoredProjectData.restoredRecordings}
          />
        )}

        <Button onClick={onGoToWorkspace} size="lg" className="w-full px-7 py-6">
          Go to {restoreType === 'workspace' ? 'Workspace' : 'Project'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState({ restoreType }: { restoreType: RestoreType }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        {restoreType === 'workspace' ? (
          <div className="w-full p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted shrink-0" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted shrink-0" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  restoreType,
  errorMessage,
  onGoToDashboard,
}: {
  restoreType: RestoreType;
  errorMessage?: string;
  onGoToDashboard: () => void;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Unable to restore {restoreType}</h1>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Image
            src={mediaClient.getIconMediaUrl('icons/dino.svg')}
            alt="Error"
            width={120}
            height={120}
            className="opacity-80"
          />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {errorMessage ||
                `This ${restoreType} may have already been restored or the restoration period has expired.`}
            </p>
          </div>
        </div>

        <Button onClick={onGoToDashboard} size="lg" className="w-full px-6">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * Confirmation state component
 */
function ConfirmationState({
  restoreType,
  restorationStatus,
  workspaceInfo,
  projectInfo,
  isPending,
  onRestore,
  onCancel,
}: {
  restoreType: RestoreType;
  restorationStatus?: RestorationStatus;
  workspaceInfo?: {
    workspaceId?: string;
    workspaceName: string;
    projectsToRestore: number;
    linksToRestore: number;
    membersToRestore: number;
    recordingsToRestore: number;
  };
  projectInfo?: {
    projectName: string;
    workspaceId: string;
    linksToRestore: number;
    recordingsToRestore: number;
  };
  isPending: boolean;
  onRestore: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">
            Restore {restoreType === 'workspace' ? 'workspace' : 'project'}?
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {restorationStatus === 'partial'
              ? 'Some data may not be fully recoverable'
              : `Confirm restoration of your deleted ${restoreType}`}
          </p>
        </div>

        {restorationStatus === 'partial' && (
          <div className="w-full p-4 rounded-lg border border-border bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Partial Restoration</p>
                <p className="text-xs text-muted-foreground">
                  This {restoreType} was deleted more than 3 days ago. Some recordings and data may
                  not be fully recoverable.
                </p>
              </div>
            </div>
          </div>
        )}

        {restoreType === 'workspace' && workspaceInfo && (
          <WorkspaceCard
            workspaceId={workspaceInfo.workspaceId}
            workspaceName={workspaceInfo.workspaceName}
            projectsRestored={workspaceInfo.projectsToRestore}
            linksRestored={workspaceInfo.linksToRestore}
            membersRestored={workspaceInfo.membersToRestore}
            recordingsRestored={workspaceInfo.recordingsToRestore}
          />
        )}

        {restoreType === 'project' && projectInfo && (
          <ProjectCard
            projectName={projectInfo.projectName}
            linksRestored={projectInfo.linksToRestore}
            recordingsRestored={projectInfo.recordingsToRestore}
          />
        )}

        <div className="w-full space-y-3">
          <Button onClick={onRestore} disabled={isPending} size="lg" className="w-full px-7 py-6">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring {restoreType}...
              </>
            ) : (
              `Restore ${restoreType === 'workspace' ? 'Workspace' : 'Project'}`
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestorePageContent() {
  const [type] = useQueryState('type');
  const [id] = useQueryState('id'); // For workspace restore
  const [workspaceId] = useQueryState('workspaceId'); // For project restore
  const [projectId] = useQueryState('projectId'); // For project restore
  const [restored, setRestored] = useState(false);
  const [restoredWorkspaceData, setRestoredWorkspaceData] = useState<{
    workspaceId: string;
    workspaceName: string;
    restoredProjects: number;
    restoredLinks: number;
    restoredMembers: number;
    restoredRecordings: number;
    restorationStatus: RestorationStatus;
  } | null>(null);
  const [restoredProjectData, setRestoredProjectData] = useState<{
    projectName: string;
    workspaceId: string;
    restoredLinks: number;
    restoredRecordings: number;
    restorationStatus: RestorationStatus;
  } | null>(null);

  const router = useRouter();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  // Determine restore type
  const restoreType = (
    type === 'workspace' || type === 'project' ? type : null
  ) as RestoreType | null;

  // Fetch restore info based on type
  const workspaceRestoreInfo = useWorkspaceRestoreInfo(restoreType === 'workspace' ? id : null);
  const projectRestoreInfo = useProjectRestoreInfo(
    restoreType === 'project' ? workspaceId : null,
    restoreType === 'project' ? projectId : null
  );

  // Restore mutations
  const { mutate: restoreWorkspace, isPending: isRestoringWorkspace } = useRestoreWorkspace();
  const { mutate: restoreProject, isPending: isRestoringProject } = useRestoreProject();

  const isPending = isRestoringWorkspace || isRestoringProject;

  // Get current restore info
  const isLoading =
    (restoreType === 'workspace' && workspaceRestoreInfo.isLoading) ||
    (restoreType === 'project' && projectRestoreInfo.isLoading);

  const error =
    (restoreType === 'workspace' && !workspaceRestoreInfo.data?.success) ||
    (restoreType === 'project' && !projectRestoreInfo.data?.success);

  // Check restoration status
  const restorationStatus =
    restoreType === 'workspace' && workspaceRestoreInfo.data?.success
      ? workspaceRestoreInfo.data.data.restoration
      : restoreType === 'project' && projectRestoreInfo.data?.success
        ? projectRestoreInfo.data.data.restoration
        : undefined;

  // Handle restore action
  const handleRestore = () => {
    if (restoreType === 'workspace') {
      if (!id) return;

      restoreWorkspace(
        { workspaceId: id },
        {
          onSuccess: (result) => {
            if (result.success) {
              setWorkspaceStore(result.data.workspace.workspaceId);
              setRestoredWorkspaceData({
                workspaceId: result.data.workspace.workspaceId,
                workspaceName: result.data.workspace.workspaceName,
                restoredProjects: result.data.restoredProjects,
                restoredLinks: result.data.restoredLinks,
                restoredMembers: result.data.restoredMembers,
                restoredRecordings: result.data.restoredRecordings,
                restorationStatus: result.data.restorationStatus,
              });
              setRestored(true);
            }
          },
        }
      );
    } else if (restoreType === 'project') {
      if (!workspaceId || !projectId) return;

      restoreProject(
        { workspaceId, projectId },
        {
          onSuccess: (result) => {
            if (result.success) {
              setWorkspaceStore(result.data.workspaceId);
              setRestoredProjectData({
                projectName: result.data.project.projectTitle || 'Untitled Project',
                workspaceId: result.data.workspaceId,
                restoredLinks: result.data.restoredLinks,
                restoredRecordings: result.data.restoredRecordings,
                restorationStatus: result.data.restorationStatus,
              });
              setRestored(true);
            }
          },
        }
      );
    }
  };

  const handleGoToWorkspace = () => {
    if (restoreType === 'workspace' && id) {
      router.push(`/workspace/${id}`);
    } else if (restoreType === 'project' && workspaceId && projectId) {
      router.push(`/workspace/${workspaceId}/projects/${projectId}`);
    }
  };

  // Invalid params
  const hasValidParams =
    (restoreType === 'workspace' && id) || (restoreType === 'project' && workspaceId && projectId);

  if (!restoreType || !hasValidParams) {
    return <InvalidParamsState onGoToDashboard={() => router.push('/')} />;
  }

  // Show success state after restoration
  if (restored) {
    return (
      <SuccessState
        restoreType={restoreType}
        restoredWorkspaceData={restoredWorkspaceData}
        restoredProjectData={restoredProjectData}
        onGoToWorkspace={handleGoToWorkspace}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState restoreType={restoreType} />;
  }

  // Error state - only show dino for true errors or impossible restoration
  if (error || restorationStatus === 'impossible') {
    const errorMessage =
      restoreType === 'workspace'
        ? workspaceRestoreInfo.data?.success
          ? workspaceRestoreInfo.data.data.reason
          : workspaceRestoreInfo.data?.error?.message
        : restoreType === 'project'
          ? projectRestoreInfo.data?.success
            ? projectRestoreInfo.data.data.reason
            : projectRestoreInfo.data?.error?.message
          : undefined;

    return (
      <ErrorState
        restoreType={restoreType}
        errorMessage={errorMessage}
        onGoToDashboard={() => router.push('/')}
      />
    );
  }

  // Confirmation state
  return (
    <ConfirmationState
      restoreType={restoreType}
      restorationStatus={restorationStatus}
      workspaceInfo={
        restoreType === 'workspace' && workspaceRestoreInfo.data?.success
          ? {
              workspaceId: workspaceRestoreInfo.data.data.workspace.workspaceId,
              workspaceName: workspaceRestoreInfo.data.data.workspace.workspaceName,
              projectsToRestore: workspaceRestoreInfo.data.data.projectsToRestore,
              linksToRestore: workspaceRestoreInfo.data.data.linksToRestore,
              membersToRestore: workspaceRestoreInfo.data.data.membersToRestore,
              recordingsToRestore: workspaceRestoreInfo.data.data.recordingsToRestore,
            }
          : undefined
      }
      projectInfo={
        restoreType === 'project' && projectRestoreInfo.data?.success
          ? {
              projectName: projectRestoreInfo.data.data.project.projectTitle || 'Untitled Project',
              workspaceId: projectRestoreInfo.data.data.project.workspaceId,
              linksToRestore: projectRestoreInfo.data.data.linksToRestore,
              recordingsToRestore: projectRestoreInfo.data.data.recordingsToRestore,
            }
          : undefined
      }
      isPending={isPending}
      onRestore={handleRestore}
      onCancel={() => router.push('/')}
    />
  );
}

/**
 * Workspace card with restoration info
 */
function WorkspaceCard({
  workspaceId,
  workspaceName,
  projectsRestored,
  linksRestored,
  membersRestored,
  recordingsRestored,
}: {
  workspaceId?: string;
  workspaceName: string;
  projectsRestored: number;
  linksRestored: number;
  membersRestored: number;
  recordingsRestored: number;
}) {
  return (
    <div className="w-full p-4 rounded-xl border bg-card">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-full border-2 border-card overflow-hidden shrink-0 cursor-default">
                <WorkspaceAvatar
                  workspaceId={workspaceId}
                  workspaceName={workspaceName}
                  size={WORKSPACE_AVATAR_SIZES.GROUP}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">{workspaceName} workspace</span>
            </TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium text-foreground truncate">{workspaceName}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{membersRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {membersRestored} member{membersRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>{projectsRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {projectsRestored} project{projectsRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                <span>{linksRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {linksRestored} link{linksRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                <span>{recordingsRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {recordingsRestored} recording{recordingsRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/**
 * Project card with restoration info
 */
function ProjectCard({
  projectName,
  linksRestored,
  recordingsRestored,
}: {
  projectName: string;
  linksRestored: number;
  recordingsRestored: number;
}) {
  return (
    <div className="w-full p-4 rounded-xl border bg-card">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-full border-2 border-card overflow-hidden shrink-0">
            <BoringAvatar name={projectName} size={AVATAR_SIZES.GROUP} />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{projectName}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                <span>{linksRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {linksRestored} link{linksRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                <span>{recordingsRestored}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {recordingsRestored} recording{recordingsRestored !== 1 ? 's' : ''}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default function RestorePage() {
  return (
    <Suspense fallback={<LoadingState restoreType="workspace" />}>
      <RestorePageContent />
    </Suspense>
  );
}
