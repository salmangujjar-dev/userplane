import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { WorkspaceSwitcherSkeleton } from '@/components/shared/skeletons';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { useWorkspaces } from '@/features/workspace';
import { useWorkspaceId, useWorkspaceStore } from '@/stores/workspace';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

export function WorkspaceSwitcher() {
  const currentWorkspaceId = useWorkspaceId();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { data: result, isLoading } = useWorkspaces();

  const workspaces = result?.success ? result.data.workspaces : [];
  const currentWorkspace = workspaces.find((ws) => ws.workspaceId === currentWorkspaceId);

  if (isLoading) {
    return <WorkspaceSwitcherSkeleton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors border border-border">
          <WorkspaceAvatar
            workspaceId={currentWorkspace?.workspaceId}
            workspaceName={currentWorkspace?.workspaceName}
            size={WORKSPACE_AVATAR_SIZES.COMPACT}
          />
          <span className="text-sm font-medium flex-1 truncate text-left">
            {currentWorkspace?.workspaceName || 'Select Workspace'}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) p-2">
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Workspaces</div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {workspaces.map((ws) => (
            <button
              key={ws.workspaceId}
              onClick={() => setWorkspace(ws.workspaceId)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left"
            >
              <WorkspaceAvatar
                workspaceId={ws.workspaceId}
                workspaceName={ws.workspaceName}
                size={WORKSPACE_AVATAR_SIZES.COMPACT}
              />
              <span className="text-sm flex-1 truncate">{ws.workspaceName}</span>
              {ws.workspaceId === currentWorkspaceId && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator className="-mx-2 my-2" />
        <button
          onClick={() => chrome.tabs.create({ url: `${DASH_URL}/workspace/create` })}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
