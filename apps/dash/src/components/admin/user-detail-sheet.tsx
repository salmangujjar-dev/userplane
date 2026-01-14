'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@workspace/ui/components/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { VisuallyHidden } from '@workspace/ui/components/visually-hidden';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import {
  Building2,
  MonitorSmartphone,
  Ban,
  CheckCircle,
  UserCog,
  AlertCircle,
  MoreVertical,
  XCircle,
  Mail,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AdminUserDetail, AdminUserSession, AdminUserWorkspace } from '@/hooks/use-admin-api';
import { usePermissions } from '@/hooks/use-permissions';

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserDetail | null;
  isLoading: boolean;
  workspaces: AdminUserWorkspace[];
  isLoadingWorkspaces: boolean;
  workspacesTotal: number;
  workspacesPage: number;
  workspacesPageSize: number;
  onWorkspacesPageChange: (page: number) => void;
  sessions: AdminUserSession[];
  isLoadingSessions: boolean;
  sessionsTotal: number;
  sessionsPage: number;
  sessionsPageSize: number;
  onSessionsPageChange: (page: number) => void;
  onImpersonate: () => void;
  onBan: () => void;
  onUnban: () => void;
  onRevokeSession: (session: AdminUserSession) => void;
  isCurrentUser: boolean;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isBanExpired(banExpires: string | null): boolean {
  if (!banExpires) return false;
  return new Date(banExpires) < new Date();
}

export function UserDetailSheet({
  open,
  onOpenChange,
  user,
  isLoading,
  workspaces,
  isLoadingWorkspaces,
  workspacesTotal,
  workspacesPage,
  workspacesPageSize,
  onWorkspacesPageChange,
  sessions,
  isLoadingSessions,
  sessionsTotal,
  sessionsPage,
  sessionsPageSize,
  onSessionsPageChange,
  onImpersonate,
  onBan,
  onUnban,
  onRevokeSession,
  isCurrentUser,
}: UserDetailSheetProps) {
  const { can } = usePermissions();
  const isBanned = user ? !!user.banned && !isBanExpired(user.banExpires) : false;
  const totalSessionPages = Math.ceil(sessionsTotal / sessionsPageSize);
  const totalWorkspacePages = Math.ceil(workspacesTotal / workspacesPageSize);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] p-0 overflow-hidden rounded-l-xl"
        showCloseButton={false}
      >
        {isLoading ? (
          <>
            <VisuallyHidden>
              <SheetTitle>Loading user details</SheetTitle>
            </VisuallyHidden>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </>
        ) : !user ? (
          <>
            <VisuallyHidden>
              <SheetTitle>User not found</SheetTitle>
            </VisuallyHidden>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">User not found</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4">
              <div className="flex items-center gap-3">
                <BoringAvatar size={32} name={user.email} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-base">{user.name || 'No name'}</SheetTitle>
                    {user.emailVerified && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-help h-5 w-5 p-0 flex items-center justify-center text-green-600 border-green-200"
                          >
                            <Mail className="h-3 w-3" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Email Verified</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={isBanned ? 'destructive' : 'outline'}
                          className="text-xs cursor-help h-5 w-5 p-0 flex items-center justify-center"
                        >
                          {isBanned ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{isBanned ? 'Banned' : 'Active'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onImpersonate();
                          }}
                          disabled={!can.impersonateUser || isCurrentUser || isBanned}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                        {isBanned ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnban();
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
                              onBan();
                            }}
                            disabled={!can.banUser || isCurrentUser || user.role === 'admin'}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <SheetDescription className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-6">
              {isBanned && user.banReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <Ban className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Ban Reason</p>
                      <p className="text-sm text-red-700 mt-1">{user.banReason}</p>
                      {user.banExpires && (
                        <p className="text-xs text-red-600 mt-2">
                          Expires: {formatDateTime(user.banExpires)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Workspaces ({workspacesTotal})
                  </h5>
                  {workspacesTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onWorkspacesPageChange(workspacesPage - 1)}
                        disabled={workspacesPage === 0 || isLoadingWorkspaces}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground min-w-12 text-center">
                        {workspacesPage + 1} / {Math.max(1, totalWorkspacePages)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onWorkspacesPageChange(workspacesPage + 1)}
                        disabled={workspacesPage >= totalWorkspacePages - 1 || isLoadingWorkspaces}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {isLoadingWorkspaces ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Skeleton className="h-4 w-4" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : workspaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workspaces</p>
                ) : (
                  <div className="space-y-2">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.workspaceId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ws.workspaceName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {ws.workspaceRole}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                    Active Sessions ({sessionsTotal})
                  </h5>
                  {sessionsTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onSessionsPageChange(sessionsPage - 1)}
                        disabled={sessionsPage === 0 || isLoadingSessions}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground min-w-12 text-center">
                        {sessionsPage + 1} / {Math.max(1, totalSessionPages)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onSessionsPageChange(sessionsPage + 1)}
                        disabled={sessionsPage >= totalSessionPages - 1 || isLoadingSessions}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {isLoadingSessions ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Skeleton className="h-4 w-4" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-7 w-7" />
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active sessions</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <MonitorSmartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{session.ipAddress || 'Unknown IP'}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {formatDateTime(session.expiresAt)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onRevokeSession(session);
                              }}
                              disabled={!can.revokeSession}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke Session
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
