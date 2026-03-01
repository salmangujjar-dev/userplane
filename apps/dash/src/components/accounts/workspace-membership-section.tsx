'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@userplane/ui/components/table';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, ArrowUpRight, Bell, LogOut, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { LeaveWorkspaceModal } from '@/components/modals/leave-workspace-modal';
import { SectionError } from '@/components/shared/section-error';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { WorkspaceMembershipSkeleton } from '@/components/skeleton';
import { WORKSPACE_PAGINATION } from '@/constants';
import { useLeaveWorkspace, useWorkspaces } from '@/features/workspace';
import { useWorkspaceId } from '@/stores/workspace';

export function WorkspaceMembershipSection() {
  const router = useRouter();
  const currentWorkspaceId = useWorkspaceId();
  const [currentPage, setCurrentPage] = useState(1);
  const [leaveWorkspaceId, setLeaveWorkspaceId] = useState<string | null>(null);
  const [leaveWorkspaceName, setLeaveWorkspaceName] = useState<string>('');
  const [leaveWorkspaceIsOwner, setLeaveWorkspaceIsOwner] = useState<boolean>(false);

  const {
    data: workspacesResult,
    isLoading,
    error,
    refetch,
  } = useWorkspaces({
    page: currentPage,
    perPage: WORKSPACE_PAGINATION.MAX_PER_PAGE,
    includeWorkspaceMembership: true,
  });

  const workspaces = workspacesResult?.success ? workspacesResult.data.workspaces : [];
  const pagination = workspacesResult?.success ? workspacesResult.data.pagination : null;

  const leaveWorkspaceMutation = useLeaveWorkspace(currentWorkspaceId, (path) => {
    router.push(path);
  });

  const handleSwitchWorkspace = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`);
  };

  const handleLeaveWorkspace = (workspaceId: string, workspaceName: string, isOwner: boolean) => {
    setLeaveWorkspaceId(workspaceId);
    setLeaveWorkspaceName(workspaceName);
    setLeaveWorkspaceIsOwner(isOwner);
  };

  const handleConfirmLeave = () => {
    if (leaveWorkspaceId) {
      leaveWorkspaceMutation.mutate(leaveWorkspaceId);
      setLeaveWorkspaceId(null);
      setLeaveWorkspaceName('');
      setLeaveWorkspaceIsOwner(false);
    }
  };

  if (isLoading) {
    return <WorkspaceMembershipSkeleton />;
  }

  if (error || (workspacesResult && !workspacesResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspaces</h2>
          <p className="text-sm text-muted-foreground">Manage workspace membership</p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load workspaces"
            description={
              error instanceof Error
                ? error.message
                : workspacesResult && !workspacesResult.success
                  ? workspacesResult.error.message
                  : 'Something went wrong while loading workspaces.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <p className="text-sm text-muted-foreground">Manage workspace membership</p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No workspaces found
                  </TableCell>
                </TableRow>
              ) : (
                workspaces.map((workspace) => {
                  const isCurrentWorkspace = workspace.workspaceId === currentWorkspaceId;
                  const joinedAt = workspace.workspaceMembership?.workspaceJoinedAt;
                  const role = workspace.workspaceMembership?.workspaceRole;

                  return (
                    <TableRow key={workspace.workspaceId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full border-2 border-background overflow-hidden">
                            <WorkspaceAvatar
                              workspaceId={workspace.workspaceId}
                              workspaceName={workspace.workspaceName}
                              size={WORKSPACE_AVATAR_SIZES.USER}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {workspace.workspaceName}
                              {isCurrentWorkspace && (
                                <span className="text-xs text-muted-foreground">(current)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{role || 'member'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {joinedAt ? formatDistanceToNow(joinedAt, { addSuffix: true }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isCurrentWorkspace && (
                              <DropdownMenuItem
                                onClick={() => handleSwitchWorkspace(workspace.workspaceId)}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Switch to workspace
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/workspace/${workspace.workspaceId}/settings?tab=notifications`
                                )
                              }
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Notification Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleLeaveWorkspace(
                                  workspace.workspaceId,
                                  workspace.workspaceName,
                                  role === 'owner'
                                )
                              }
                              disabled={leaveWorkspaceMutation.isPending}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Leave workspace
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {workspaces.length} of {pagination.total} workspaces
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          <Link
            href="/workspace/create"
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Create a new workspace
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <LeaveWorkspaceModal
        open={!!leaveWorkspaceId}
        onOpenChange={() => {
          setLeaveWorkspaceId(null);
          setLeaveWorkspaceName('');
          setLeaveWorkspaceIsOwner(false);
        }}
        workspaceName={leaveWorkspaceName}
        isOwner={leaveWorkspaceIsOwner}
        onConfirm={handleConfirmLeave}
        isLoading={leaveWorkspaceMutation.isPending}
      />
    </div>
  );
}
