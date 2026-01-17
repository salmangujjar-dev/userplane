'use client';

import { useState } from 'react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Button } from '@workspace/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { UserCog, Ban, MoreVertical } from 'lucide-react';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useAdminWorkspaceMembers } from '@/hooks/use-admin-workspace-api';
import { useAdminBanUser } from '@/hooks/use-admin-api';
import { useImpersonation } from '@/hooks/use-impersonation';
import { AdminBanUserModal } from '@/components/modals/admin-ban-user-modal';
import { ImpersonateConfirmModal } from '@/components/modals/impersonate-confirm-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { MEMBERS_PER_PAGE } from './utils';
import type { UserToAction } from './types';

interface MembersTabProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function MembersTab({ workspaceId, isAdmin }: MembersTabProps) {
  const [membersPage, setMembersPage] = useState(0);
  const [userToImpersonate, setUserToImpersonate] = useState<UserToAction | null>(null);
  const [userToBan, setUserToBan] = useState<UserToAction | null>(null);

  const { can } = usePermissions();
  const { impersonateUser, isPending: isImpersonating } = useImpersonation();
  const banMutation = useAdminBanUser();

  const { data: workspaceMembersResult, isLoading: isLoadingWorkspaceMembers } =
    useAdminWorkspaceMembers({
      workspaceId,
      limit: MEMBERS_PER_PAGE,
      offset: membersPage * MEMBERS_PER_PAGE,
      enabled: isAdmin,
    });

  const workspaceMembers = workspaceMembersResult?.success
    ? workspaceMembersResult.data.members
    : [];
  const workspaceMembersTotal = workspaceMembersResult?.success
    ? workspaceMembersResult.data.total
    : 0;

  const handleImpersonateUser = (userId: string, userName: string, userEmail: string) => {
    setUserToImpersonate({ id: userId, name: userName, email: userEmail });
  };

  const confirmImpersonate = () => {
    if (userToImpersonate) {
      impersonateUser({
        userId: userToImpersonate.id,
        userName: userToImpersonate.name,
      });
    }
  };

  const handleBanUser = (userId: string, userName: string, userEmail: string) => {
    setUserToBan({ id: userId, name: userName, email: userEmail });
  };

  const confirmBan = (options: { reason: string; expiresInSeconds?: number }) => {
    if (userToBan) {
      banMutation.mutate(
        { userId: userToBan.id, ...options },
        { onSuccess: () => setUserToBan(null) }
      );
    }
  };

  return (
    <>
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">Manage workspace members and permissions</p>
        </div>

        <div className="max-w-2xl">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingWorkspaceMembers ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : workspaceMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  workspaceMembers.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BoringAvatar size={32} name={member.userEmail} />
                          <div>
                            <div className="font-medium text-sm">{member.userName}</div>
                            <div className="text-xs text-muted-foreground">{member.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{member.workspaceRole}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleImpersonateUser(
                                  member.userId,
                                  member.userName,
                                  member.userEmail
                                )
                              }
                              disabled={!can.impersonateUser}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleBanUser(member.userId, member.userName, member.userEmail)
                              }
                              disabled={!can.banUser}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {workspaceMembersTotal > 0 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={membersPage + 1}
                totalPages={Math.max(1, Math.ceil(workspaceMembersTotal / MEMBERS_PER_PAGE))}
                onPageChange={(page) => setMembersPage(page - 1)}
              />
            </div>
          )}
        </div>
      </div>

      <ImpersonateConfirmModal
        open={!!userToImpersonate}
        onOpenChange={(open) => !open && setUserToImpersonate(null)}
        user={userToImpersonate}
        onConfirm={confirmImpersonate}
        isPending={isImpersonating}
      />

      <AdminBanUserModal
        open={!!userToBan}
        onOpenChange={(open) => !open && setUserToBan(null)}
        user={userToBan}
        onConfirm={confirmBan}
        isPending={banMutation.isPending}
      />
    </>
  );
}
