import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

import { BoringAvatar } from '@/components/shared/boring-avatar';

interface WorkspaceCardProps {
  workspaceName: string;
}

export function WorkspaceCard({ workspaceName }: WorkspaceCardProps) {
  // Generate consistent "member" names based on workspace name for avatars
  const avatarNames = [
    `${workspaceName}-member-1`,
    `${workspaceName}-member-2`,
    `${workspaceName}-member-3`,
  ];

  return (
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
            <span className="text-xs">{workspaceName} workspace</span>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium text-foreground text-center">{workspaceName}</span>
      </div>
    </div>
  );
}
