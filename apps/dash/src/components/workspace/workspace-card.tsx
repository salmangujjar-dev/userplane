import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';

interface WorkspaceCardProps {
  workspaceName: string;
}

export function WorkspaceCard({ workspaceName }: WorkspaceCardProps) {
  return (
    <div className="w-full p-6 rounded-xl border bg-card">
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
        <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
      </div>
    </div>
  );
}
