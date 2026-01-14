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
  FolderKanban,
  Globe,
  Link2,
  Video,
  PowerOff,
  KeyRound,
  AlertCircle,
  Building2,
  MoreVertical,
  UserCog,
  Ban,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import type { AdminWorkspaceDetail, AdminWorkspaceMember } from '@/hooks/use-admin-workspace-api';
import { DEFAULT_PLAN_NAME } from '@workspace/pricing';
import { usePermissions } from '@/hooks/use-permissions';

interface WorkspaceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: AdminWorkspaceDetail | null;
  isLoading: boolean;
  members: AdminWorkspaceMember[];
  isLoadingMembers: boolean;
  membersTotal: number;
  membersPage: number;
  membersPageSize: number;
  onMembersPageChange: (page: number) => void;
  onDeactivate: () => void;
  onResetInviteToken: () => void;
  onImpersonateUser?: (userId: string, userName: string, userEmail: string) => void;
  onBanUser?: (userId: string, userName: string, userEmail: string) => void;
}

export function WorkspaceDetailSheet({
  open,
  onOpenChange,
  workspace,
  isLoading,
  members,
  isLoadingMembers,
  membersTotal,
  membersPage,
  membersPageSize,
  onMembersPageChange,
  onDeactivate,
  onResetInviteToken,
  onImpersonateUser,
  onBanUser,
}: WorkspaceDetailSheetProps) {
  const { can, isAdmin } = usePermissions();
  const totalPages = Math.ceil(membersTotal / membersPageSize);
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
              <SheetTitle>Loading workspace details</SheetTitle>
            </VisuallyHidden>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex items-center gap-2 mt-2 ml-7">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </>
        ) : !workspace ? (
          <>
            <VisuallyHidden>
              <SheetTitle>Workspace not found</SheetTitle>
            </VisuallyHidden>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Workspace not found</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4">
              <div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SheetTitle className="text-base">{workspace.workspaceName}</SheetTitle>
                  <Badge variant="secondary" className="rounded-md text-xs">
                    {workspace.workspacePlanName || DEFAULT_PLAN_NAME}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={workspace.isDeleted ? 'destructive' : 'outline'}
                        className="text-xs cursor-help h-5 w-5 p-0 flex items-center justify-center"
                      >
                        {workspace.isDeleted ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{workspace.isDeleted ? 'Deactivated' : 'Active'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <VisuallyHidden>
                    <SheetDescription>Workspace details</SheetDescription>
                  </VisuallyHidden>
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
                          onResetInviteToken();
                        }}
                        disabled={!isAdmin || workspace.isDeleted}
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Reset Invite Token
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeactivate();
                        }}
                        disabled={!isAdmin || workspace.isDeleted}
                        className="text-red-600 focus:text-red-600"
                      >
                        <PowerOff className="h-4 w-4 mr-2" />
                        Deactivate Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-4">
              <div>
                <h5 className="text-sm font-medium mb-3">Statistics</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{workspace.projectCount}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{workspace.domainCount}</p>
                      <p className="text-xs text-muted-foreground">Domains</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{workspace.linkCount}</p>
                      <p className="text-xs text-muted-foreground">Links</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{workspace.recordingCount}</p>
                      <p className="text-xs text-muted-foreground">Recordings</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Members ({workspace.memberCount})
                  </h5>
                  {membersTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onMembersPageChange(membersPage - 1)}
                        disabled={membersPage === 0 || isLoadingMembers}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground min-w-12 text-center">
                        {membersPage + 1} / {Math.max(1, totalPages)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onMembersPageChange(membersPage + 1)}
                        disabled={membersPage >= totalPages - 1 || isLoadingMembers}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {isLoadingMembers ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-5 w-14" />
                      </div>
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <BoringAvatar name={member.userEmail} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.userName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.userEmail}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize text-xs">
                          {member.workspaceRole}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onImpersonateUser?.(
                                  member.userId,
                                  member.userName,
                                  member.userEmail
                                );
                              }}
                              disabled={!can.impersonateUser}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onBanUser?.(member.userId, member.userName, member.userEmail);
                              }}
                              disabled={!can.banUser}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban User
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
