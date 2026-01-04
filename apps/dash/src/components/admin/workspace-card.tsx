'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import {
  MoreVertical,
  Users,
  FolderKanban,
  Globe,
  Link2,
  Video,
  PowerOff,
  KeyRound,
  Building2,
} from 'lucide-react';

interface WorkspaceCardProps {
  workspaceName: string;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
  isDeleted: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onDeactivate?: () => void;
  onResetInviteToken?: () => void;
}

export function WorkspaceCard({
  workspaceName,
  memberCount,
  projectCount,
  domainCount,
  linkCount,
  recordingCount,
  isDeleted,
  isSelected,
  onClick,
  onDeactivate,
  onResetInviteToken,
}: WorkspaceCardProps) {
  return (
    <div
      className={`rounded-xl border transition-colors p-4 cursor-pointer ${
        isSelected ? 'border-foreground' : 'border-border hover:border-foreground'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="text-sm font-medium truncate">{workspaceName}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{memberCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span>{projectCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {projectCount} project{projectCount !== 1 ? 's' : ''}
                  </span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{domainCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {domainCount} domain{domainCount !== 1 ? 's' : ''}
                  </span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>{linkCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {linkCount} link{linkCount !== 1 ? 's' : ''}
                  </span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    <span>{recordingCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {recordingCount} recording{recordingCount !== 1 ? 's' : ''}
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onResetInviteToken?.();
                }}
                disabled={isDeleted}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Reset Invite Token
              </DropdownMenuItem>
              {!isDeleted && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeactivate?.();
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
