import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { type ReactNode, useEffect } from 'react';

import { DecorativeIcons } from '@/components/auth/LoginPrompt';
import { NoWorkspaceState } from '@/components/shared/empty-state';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { useWorkspaces } from '@/features/workspace';
import { useWorkspaceHydrated, useWorkspaceId, useWorkspaceStore } from '@/stores/workspace';

interface WorkspaceGuardProps {
  children: ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const hydrated = useWorkspaceHydrated();
  const workspaceId = useWorkspaceId();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { data: result, isPending: isLoading } = useWorkspaces();

  const workspaces = result?.success ? result.data.workspaces : undefined;

  // Auto-select single workspace
  useEffect(() => {
    if (!workspaceId && workspaces?.length === 1 && workspaces[0]) {
      setWorkspace(workspaces[0].workspaceId);
    }
  }, [workspaceId, workspaces, setWorkspace]);

  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <NoWorkspaceState />
      </div>
    );
  }

  // Multiple workspaces but none selected — show picker
  if (!workspaceId && workspaces.length > 1) {
    return (
      <div className="relative flex flex-col items-center justify-center h-screen bg-background overflow-hidden">
        <div className="flex flex-col items-center gap-8 px-8 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <p className="text-sm text-muted-foreground text-center">
              Pick a workspace to get started
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-[280px]">
            {workspaces.map((ws) => (
              <Button
                key={ws.workspaceId}
                variant="outline"
                className="justify-start gap-2 px-4 py-5"
                onClick={() => setWorkspace(ws.workspaceId)}
              >
                <WorkspaceAvatar
                  workspaceId={ws.workspaceId}
                  workspaceName={ws.workspaceName}
                  size={WORKSPACE_AVATAR_SIZES.COMPACT}
                />
                {ws.workspaceName}
              </Button>
            ))}
          </div>
        </div>

        <DecorativeIcons />
      </div>
    );
  }

  return <>{children}</>;
}
