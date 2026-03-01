import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';

import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';

interface WorkspaceCardProps {
  workspaceId?: string;
  workspaceName: string;
}

export function WorkspaceCard({ workspaceId, workspaceName }: WorkspaceCardProps) {
  return (
    <div className="w-full p-6 rounded-xl border bg-card">
      <div className="flex flex-col items-center gap-3">
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
        <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
      </div>
    </div>
  );
}
