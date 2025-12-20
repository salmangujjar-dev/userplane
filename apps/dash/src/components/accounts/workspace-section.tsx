'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import { toast } from '@workspace/ui/components/sonner';
import { Building2, ArrowUpRight, ChevronDown } from 'lucide-react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceId, useWorkspaceStore } from '@/stores/workspace';
import { apiClient } from '@/client';
import { formatDistanceToNow } from 'date-fns';
import { LeaveWorkspaceModal } from '@/components/modals/leave-workspace-modal';

interface WorkspaceNotifications {
  notifyOnLinkUsage: boolean;
  notifyOnQuotaReset: boolean;
  notifyOnQuotaLimit: boolean;
  notifyOnMemberJoin: boolean;
  notifyOnInviteAccepted: boolean;
}

interface Workspace {
  workspaceId: string;
  workspaceName: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isCurrent: boolean;
  notifications: WorkspaceNotifications;
  role: 'owner' | 'admin' | 'member';
}

const ITEMS_PER_PAGE = 5;

export function WorkspaceSection() {
  const router = useRouter();
  const currentWorkspaceId = useWorkspaceId();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [leavingWorkspace, setLeavingWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
    isOwner: boolean;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: workspacesData, isLoading } = useWorkspaces({
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
  });

  const workspaces = useMemo<Workspace[]>(() => {
    if (!workspacesData?.workspaces) return [];

    return workspacesData.workspaces.map((ws) => ({
      workspaceId: ws.workspaceId,
      workspaceName: ws.workspaceName,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      isCurrent: ws.workspaceId === currentWorkspaceId,
      notifications: {
        notifyOnLinkUsage: ws.notificationPreferences?.notifyOnLinkUsage ?? false,
        notifyOnQuotaReset: ws.notificationPreferences?.notifyOnQuotaReset ?? false,
        notifyOnQuotaLimit: ws.notificationPreferences?.notifyOnQuotaLimit ?? false,
        notifyOnMemberJoin: ws.notificationPreferences?.notifyOnMemberJoin ?? false,
        notifyOnInviteAccepted: ws.notificationPreferences?.notifyOnInviteAccepted ?? false,
      },
      role: ws.workspaceMembership?.workspaceRole ?? 'member',
    }));
  }, [workspacesData, currentWorkspaceId]);

  const totalPages = workspacesData?.pagination
    ? Math.ceil(workspacesData.total / ITEMS_PER_PAGE)
    : 1;

  const updateNotificationsMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      notifications,
    }: {
      workspaceId: string;
      notifications: Partial<WorkspaceNotifications>;
    }) => {
      return await apiClient.workspace.notifications.update({
        params: { workspaceId },
        body: notifications,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Notification preferences updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notifications: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const rotateInviteMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      return await apiClient.workspace.invite.rotate({
        params: { workspaceId },
      });
    },
    onSuccess: () => {
      toast.success('Invite token reset successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset invite token: ${error.message}`);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      return await apiClient.workspace.delete({
        params: { workspaceId },
      });
    },
    onSuccess: async (_, deletedWorkspaceId) => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace deleted successfully');

      if (deletedWorkspaceId === currentWorkspaceId) {
        const remainingWorkspaces = workspaces.filter(
          (ws) => ws.workspaceId !== deletedWorkspaceId
        );

        if (remainingWorkspaces.length > 0 && remainingWorkspaces[0]) {
          const nextWorkspace = remainingWorkspaces[0];
          setWorkspaceStore(nextWorkspace.workspaceId);
          router.push(`/${nextWorkspace.workspaceId}/preferences`);
        } else {
          router.push('/workspace/create');
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete workspace: ${error.message}`);
    },
  });

  const leaveWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      return await apiClient.workspace.members.leave({
        params: { workspaceId },
      });
    },
    onSuccess: async (_, leftWorkspaceId) => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Left workspace successfully');

      if (leftWorkspaceId === currentWorkspaceId) {
        const remainingWorkspaces = workspaces.filter((ws) => ws.workspaceId !== leftWorkspaceId);

        if (remainingWorkspaces.length > 0 && remainingWorkspaces[0]) {
          const nextWorkspace = remainingWorkspaces[0];
          setWorkspaceStore(nextWorkspace.workspaceId);
          router.push(`/${nextWorkspace.workspaceId}/preferences`);
        } else {
          router.push('/workspace/create');
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to leave workspace: ${error.message}`);
    },
  });

  const handleSwitch = (workspaceId: string) => {
    setWorkspaceStore(workspaceId);
    router.push(`/${workspaceId}/recordings`);
  };

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  const handleNotificationToggle = (
    workspaceId: string,
    key: keyof WorkspaceNotifications,
    value: boolean
  ) => {
    updateNotificationsMutation.mutate({
      workspaceId,
      notifications: { [key]: value },
    });
  };

  const handleResetInviteToken = (workspaceId: string) => {
    rotateInviteMutation.mutate(workspaceId);
  };

  const handleDeleteWorkspace = (workspaceId: string, role: string) => {
    const workspace = workspaces.find((ws) => ws.workspaceId === workspaceId);
    if (!workspace) return;

    setLeavingWorkspace({
      workspaceId,
      workspaceName: workspace.workspaceName,
      isOwner: role === 'owner',
    });
  };

  const handleConfirmLeave = () => {
    if (!leavingWorkspace) return;

    if (leavingWorkspace.isOwner) {
      deleteWorkspaceMutation.mutate(leavingWorkspace.workspaceId);
    } else {
      leaveWorkspaceMutation.mutate(leavingWorkspace.workspaceId);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <p className="text-sm text-muted-foreground">Manage current workspaces</p>
        </div>
        <div className="max-w-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Manage current workspaces</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {workspaces.map((workspace) => (
          <Collapsible
            key={workspace.workspaceId}
            open={expandedWorkspace === workspace.workspaceId}
            onOpenChange={() =>
              setExpandedWorkspace(
                expandedWorkspace === workspace.workspaceId ? null : workspace.workspaceId
              )
            }
          >
            <div className="rounded-xl border bg-card">
              <div className="w-full p-4 flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-3 flex-1 hover:opacity-70 transition-opacity">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{workspace.workspaceName}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          expandedWorkspace === workspace.workspaceId ? 'rotate-180' : ''
                        }`}
                      />
                      {workspace.isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Joined {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </CollapsibleTrigger>
                {expandedWorkspace !== workspace.workspaceId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      workspace.isCurrent
                        ? handleDeleteWorkspace(workspace.workspaceId, workspace.role)
                        : handleSwitch(workspace.workspaceId)
                    }
                    className="ml-2"
                  >
                    {workspace.isCurrent ? 'Leave' : 'Switch'}
                  </Button>
                )}
              </div>

              <CollapsibleContent>
                <div className="px-4 pb-4 pt-4 space-y-6 border-t">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Workspace Settings</div>

                    <div className="space-y-3">
                      {workspace.role === 'owner' && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-normal">
                              Reset invite token for workspace
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Generate a new invite token and invalidate the old one
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetInviteToken(workspace.workspaceId)}
                            disabled={rotateInviteMutation.isPending}
                            className="ml-2 min-w-[70px]"
                          >
                            {rotateInviteMutation.isPending ? 'Resetting...' : 'Reset'}
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-1">
                        <div className="flex-1">
                          <div className="text-sm font-normal">
                            {workspace.role === 'owner' ? 'Delete workspace' : 'Leave workspace'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {workspace.role === 'owner'
                              ? 'Permanently delete this workspace and all its data'
                              : 'Leave this workspace and remove your access'}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleDeleteWorkspace(workspace.workspaceId, workspace.role)
                          }
                          disabled={
                            deleteWorkspaceMutation.isPending || leaveWorkspaceMutation.isPending
                          }
                          className="ml-2 min-w-[70px]"
                        >
                          {deleteWorkspaceMutation.isPending || leaveWorkspaceMutation.isPending
                            ? 'Processing...'
                            : workspace.role === 'owner'
                              ? 'Delete'
                              : 'Leave'}
                        </Button>
                      </div>

                      {!workspace.isCurrent && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-normal">Switch to workspace</div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Switch to this workspace
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwitch(workspace.workspaceId)}
                            className="ml-2 min-w-[70px]"
                          >
                            Switch
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-medium">Notification Settings</div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`recording-links-${workspace.workspaceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When recording links gets used
                        </Label>
                        <Switch
                          id={`recording-links-${workspace.workspaceId}`}
                          checked={workspace.notifications.notifyOnLinkUsage}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(
                              workspace.workspaceId,
                              'notifyOnLinkUsage',
                              checked
                            )
                          }
                          disabled={updateNotificationsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`quota-reset-${workspace.workspaceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When workspace quota is reset
                        </Label>
                        <Switch
                          id={`quota-reset-${workspace.workspaceId}`}
                          checked={workspace.notifications.notifyOnQuotaReset}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(
                              workspace.workspaceId,
                              'notifyOnQuotaReset',
                              checked
                            )
                          }
                          disabled={updateNotificationsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`quota-reached-${workspace.workspaceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When workspace quota is reached
                        </Label>
                        <Switch
                          id={`quota-reached-${workspace.workspaceId}`}
                          checked={workspace.notifications.notifyOnQuotaLimit}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(
                              workspace.workspaceId,
                              'notifyOnQuotaLimit',
                              checked
                            )
                          }
                          disabled={updateNotificationsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`someone-joins-${workspace.workspaceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When someone joins my workspace
                        </Label>
                        <Switch
                          id={`someone-joins-${workspace.workspaceId}`}
                          checked={workspace.notifications.notifyOnMemberJoin}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(
                              workspace.workspaceId,
                              'notifyOnMemberJoin',
                              checked
                            )
                          }
                          disabled={updateNotificationsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`invite-accepted-${workspace.workspaceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When someone accepts my invite
                        </Label>
                        <Switch
                          id={`invite-accepted-${workspace.workspaceId}`}
                          checked={workspace.notifications.notifyOnInviteAccepted}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(
                              workspace.workspaceId,
                              'notifyOnInviteAccepted',
                              checked
                            )
                          }
                          disabled={updateNotificationsMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        <Button variant="outline" className="w-full max-w-2xl" onClick={handleCreateWorkspace}>
          Create Workspace
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <LeaveWorkspaceModal
        open={!!leavingWorkspace}
        onOpenChange={(open) => !open && setLeavingWorkspace(null)}
        workspaceName={leavingWorkspace?.workspaceName || ''}
        isOwner={leavingWorkspace?.isOwner || false}
        onConfirm={handleConfirmLeave}
        isLoading={deleteWorkspaceMutation.isPending || leaveWorkspaceMutation.isPending}
      />
    </div>
  );
}
