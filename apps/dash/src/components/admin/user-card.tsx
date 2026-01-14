'use client';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
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
  UserCog,
  MonitorSmartphone,
  Ban,
  CheckCircle,
  Trash2,
  Building2,
} from 'lucide-react';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { usePermissions } from '@/hooks/use-permissions';

interface UserCardProps {
  name: string | null;
  email: string;
  role: string | null;
  workspaceCount: number;
  banned: boolean;
  banExpires: string | null;
  isSelected?: boolean;
  onClick?: () => void;
  onImpersonate?: () => void;
  onViewSessions?: () => void;
  onBan?: () => void;
  onUnban?: () => void;
  onRevokeAllSessions?: () => void;
  isCurrentUser?: boolean;
}

function isBanExpired(banExpires: string | null): boolean {
  if (!banExpires) return false;
  return new Date(banExpires) < new Date();
}

export function UserCard({
  name,
  email,
  role,
  workspaceCount,
  banned,
  banExpires,
  isSelected,
  onClick,
  onImpersonate,
  onViewSessions,
  onBan,
  onUnban,
  onRevokeAllSessions,
  isCurrentUser,
}: UserCardProps) {
  const { can } = usePermissions();
  const displayName = name || 'No name';
  const isBanned = banned && !isBanExpired(banExpires);
  const isAdmin = role === 'admin';

  return (
    <div
      className={`rounded-xl border transition-colors p-4 cursor-pointer ${
        isSelected ? 'border-foreground' : 'border-border hover:border-foreground'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BoringAvatar name={email} size={32} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium truncate">{displayName}</h3>
                {isAdmin && (
                  <Badge variant="default" className="text-xs shrink-0">
                    Admin
                  </Badge>
                )}
                {isBanned && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    Banned
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="truncate">{email}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{workspaceCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>
                      {workspaceCount} workspace{workspaceCount !== 1 ? 's' : ''}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
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
                  onImpersonate?.();
                }}
                disabled={!can.impersonateUser || isCurrentUser || isBanned}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Impersonate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSessions?.();
                }}
                disabled={!can.listSessions}
              >
                <MonitorSmartphone className="h-4 w-4 mr-2" />
                View Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isBanned ? (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnban?.();
                  }}
                  disabled={!can.banUser}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onBan?.();
                  }}
                  disabled={!can.banUser || isCurrentUser || isAdmin}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRevokeAllSessions?.();
                }}
                disabled={!can.revokeSession}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All Sessions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
