'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Building2, ArrowUpRight, ChevronDown } from 'lucide-react';

interface WorkspaceNotifications {
  recordingLinksUsed: boolean;
  quotaReset: boolean;
  quotaReached: boolean;
  someoneJoins: boolean;
  inviteAccepted: boolean;
}

interface Workspace {
  id: string;
  name: string;
  joinedAt: string;
  isCurrent: boolean;
  notifications: WorkspaceNotifications;
}

const initialWorkspaces: Workspace[] = [
  {
    id: '1',
    name: "Lary's Workspace",
    joinedAt: 'Joined 2 months ago',
    isCurrent: true,
    notifications: {
      recordingLinksUsed: true,
      quotaReset: true,
      quotaReached: true,
      someoneJoins: true,
      inviteAccepted: true,
    },
  },
  {
    id: '2',
    name: 'Acme Corp',
    joinedAt: 'Joined 6 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: false,
      quotaReset: true,
      quotaReached: false,
      someoneJoins: false,
      inviteAccepted: false,
    },
  },
  {
    id: '3',
    name: 'Design Team',
    joinedAt: 'Joined 1 year ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: true,
      quotaReset: false,
      quotaReached: true,
      someoneJoins: true,
      inviteAccepted: true,
    },
  },
  {
    id: '4',
    name: 'Tech Startup Inc',
    joinedAt: 'Joined 3 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: true,
      quotaReset: true,
      quotaReached: false,
      someoneJoins: true,
      inviteAccepted: false,
    },
  },
  {
    id: '5',
    name: 'Marketing Team',
    joinedAt: 'Joined 8 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: false,
      quotaReset: false,
      quotaReached: true,
      someoneJoins: false,
      inviteAccepted: true,
    },
  },
  {
    id: '6',
    name: 'Engineering Hub',
    joinedAt: 'Joined 4 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: true,
      quotaReset: true,
      quotaReached: true,
      someoneJoins: true,
      inviteAccepted: true,
    },
  },
  {
    id: '7',
    name: 'Product Team',
    joinedAt: 'Joined 10 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: false,
      quotaReset: true,
      quotaReached: false,
      someoneJoins: true,
      inviteAccepted: false,
    },
  },
  {
    id: '8',
    name: 'Freelance Projects',
    joinedAt: 'Joined 5 months ago',
    isCurrent: false,
    notifications: {
      recordingLinksUsed: true,
      quotaReset: false,
      quotaReached: true,
      someoneJoins: false,
      inviteAccepted: true,
    },
  },
];

const ITEMS_PER_PAGE = 5;

export function WorkspaceSection() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(workspaces.length / ITEMS_PER_PAGE);

  const paginatedWorkspaces = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return workspaces.slice(startIndex, endIndex);
  }, [workspaces, currentPage]);

  const handleSwitch = (workspaceId: string) => {
    console.log('Switching to workspace:', workspaceId);
  };

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  const handleNotificationToggle = (
    workspaceId: string,
    key: keyof WorkspaceNotifications,
    value: boolean
  ) => {
    setWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              notifications: {
                ...workspace.notifications,
                [key]: value,
              },
            }
          : workspace
      )
    );
  };

  const handleResetInviteToken = (workspaceId: string) => {
    console.log('Resetting invite token for workspace:', workspaceId);
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    console.log('Deleting workspace:', workspaceId);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Manage current workspaces</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {paginatedWorkspaces.map((workspace) => (
          <Collapsible
            key={workspace.id}
            open={expandedWorkspace === workspace.id}
            onOpenChange={() =>
              setExpandedWorkspace(expandedWorkspace === workspace.id ? null : workspace.id)
            }
          >
            <div className="rounded-xl border bg-card">
              <div className="w-full p-4 flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-3 flex-1 hover:opacity-70 transition-opacity">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{workspace.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          expandedWorkspace === workspace.id ? 'rotate-180' : ''
                        }`}
                      />
                      {workspace.isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{workspace.joinedAt}</p>
                  </div>
                </CollapsibleTrigger>
                {expandedWorkspace !== workspace.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch(workspace.id)}
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
                          onClick={() => handleResetInviteToken(workspace.id)}
                          className="ml-2 min-w-[70px]"
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-normal">Delete workspace</div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Permanently delete this workspace and all its data
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="ml-2 min-w-[70px]"
                        >
                          Delete
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-normal">
                            {workspace.isCurrent ? 'Leave workspace' : 'Switch to workspace'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {workspace.isCurrent
                              ? 'Leave this workspace and switch to another'
                              : 'Switch to this workspace'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitch(workspace.id)}
                          className="ml-2 min-w-[70px]"
                        >
                          {workspace.isCurrent ? 'Leave' : 'Switch'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-medium">Notification Settings</div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`recording-links-${workspace.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When recording links gets used
                        </Label>
                        <Switch
                          id={`recording-links-${workspace.id}`}
                          checked={workspace.notifications.recordingLinksUsed}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(workspace.id, 'recordingLinksUsed', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`quota-reset-${workspace.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When workspace quota is reset
                        </Label>
                        <Switch
                          id={`quota-reset-${workspace.id}`}
                          checked={workspace.notifications.quotaReset}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(workspace.id, 'quotaReset', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`quota-reached-${workspace.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When workspace quota is reached
                        </Label>
                        <Switch
                          id={`quota-reached-${workspace.id}`}
                          checked={workspace.notifications.quotaReached}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(workspace.id, 'quotaReached', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`someone-joins-${workspace.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When someone joins my workspace
                        </Label>
                        <Switch
                          id={`someone-joins-${workspace.id}`}
                          checked={workspace.notifications.someoneJoins}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(workspace.id, 'someoneJoins', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`invite-accepted-${workspace.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          When someone accepts my invite
                        </Label>
                        <Switch
                          id={`invite-accepted-${workspace.id}`}
                          checked={workspace.notifications.inviteAccepted}
                          onCheckedChange={(checked) =>
                            handleNotificationToggle(workspace.id, 'inviteAccepted', checked)
                          }
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
    </div>
  );
}
