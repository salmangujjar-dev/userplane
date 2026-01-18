'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useRestoreProject, useRestoreWorkspace } from '@/hooks/use-restore';
import { useProjectRestoreInfo, useWorkspaceRestoreInfo } from '@/hooks/use-restore-info';
import { useWorkspaceStore } from '@/stores/workspace';

type RestoreType = 'workspace' | 'project';

export default function RestorePage() {
  const [type] = useQueryState('type');
  const [id] = useQueryState('id'); // For workspace restore
  const [workspaceId] = useQueryState('workspaceId'); // For project restore
  const [projectId] = useQueryState('projectId'); // For project restore
  const [restored, setRestored] = useState(false);
  const [restoredWorkspaceData, setRestoredWorkspaceData] = useState<{
    workspaceName: string;
    restoredProjects: number;
    restoredLinks: number;
  } | null>(null);
  const [restoredProjectData, setRestoredProjectData] = useState<{
    projectName: string;
    workspaceId: string;
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
                workspaceName: result.data.workspace.workspaceName,
                restoredProjects: result.data.restoredProjects,
                restoredLinks: result.data.restoredLinks,
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
      router.push(`/${id}`);
    } else if (restoreType === 'project' && workspaceId && projectId) {
      router.push(`/${workspaceId}/projects/${projectId}`);
    }
  };

  // Invalid params
  const hasValidParams =
    (restoreType === 'workspace' && id) || (restoreType === 'project' && workspaceId && projectId);

  if (!restoreType || !hasValidParams) {
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
              src="/assets/dino.svg"
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

          <Button onClick={() => router.push('/')} size="lg" className="w-full rounded-full px-6">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show success state after restoration
  if (restored) {
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
              workspaceName={restoredWorkspaceData.workspaceName}
              projectsRestored={restoredWorkspaceData.restoredProjects}
              linksRestored={restoredWorkspaceData.restoredLinks}
            />
          )}

          {restoreType === 'project' && restoredProjectData && (
            <ProjectCard
              projectName={restoredProjectData.projectName}
              workspaceId={restoredProjectData.workspaceId}
            />
          )}

          <Button onClick={handleGoToWorkspace} size="lg" className="w-full rounded-full px-7 py-6">
            Go to {restoreType === 'workspace' ? 'Workspace' : 'Project'}
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <AuthIcons />

        <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <h1 className="text-xl font-medium text-foreground">
              Loading {restoreType} details...
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we fetch the restore information
            </p>
          </div>

          <div className="w-full p-6 rounded-xl border bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      restoreType === 'workspace'
        ? workspaceRestoreInfo.data?.error?.message
        : projectRestoreInfo.data?.error?.message;

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
              src="/assets/dino.svg"
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

          <Button onClick={() => router.push('/')} size="lg" className="w-full rounded-full px-6">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Confirmation state
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
            Confirm restoration of your deleted {restoreType}
          </p>
        </div>

        {restoreType === 'workspace' && workspaceRestoreInfo.data?.success && (
          <WorkspaceCard
            workspaceName={workspaceRestoreInfo.data.data.workspace.workspaceName}
            projectsRestored={workspaceRestoreInfo.data.data.projectsToRestore}
            linksRestored={workspaceRestoreInfo.data.data.linksToRestore}
          />
        )}

        {restoreType === 'project' && projectRestoreInfo.data?.success && (
          <ProjectCard
            projectName={projectRestoreInfo.data.data.project.projectTitle || 'Untitled Project'}
            workspaceId={projectRestoreInfo.data.data.project.workspaceId}
          />
        )}

        <div className="w-full space-y-3">
          <Button
            onClick={handleRestore}
            disabled={isPending}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
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
              onClick={() => router.push('/')}
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

/**
 * Workspace card with restoration info
 */
function WorkspaceCard({
  workspaceName,
  projectsRestored,
  linksRestored,
}: {
  workspaceName: string;
  projectsRestored: number;
  linksRestored: number;
}) {
  const avatarNames = [
    `${workspaceName}-member-1`,
    `${workspaceName}-member-2`,
    `${workspaceName}-member-3`,
  ];

  return (
    <div className="w-full p-6 rounded-xl border bg-card space-y-4">
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
            <span className="text-xs">{workspaceName} workspace</span>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
      </div>

      {(projectsRestored > 0 || linksRestored > 0) && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground text-center">
          {projectsRestored > 0 && (
            <p>
              {projectsRestored} {projectsRestored === 1 ? 'project' : 'projects'} will be restored
            </p>
          )}
          {linksRestored > 0 && (
            <p>
              {linksRestored} {linksRestored === 1 ? 'link' : 'links'} will be restored
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Project card with info
 */
function ProjectCard({ projectName, workspaceId }: { projectName: string; workspaceId: string }) {
  const avatarName = `${workspaceId}-${projectName}`;

  return (
    <div className="w-full p-6 rounded-xl border bg-card">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full border-2 border-card overflow-hidden">
          <BoringAvatar name={avatarName} size={32} />
        </div>
        <span className="text-sm font-medium text-foreground text-center">{projectName}</span>
      </div>
    </div>
  );
}
