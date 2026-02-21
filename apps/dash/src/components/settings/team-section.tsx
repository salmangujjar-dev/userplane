'use client';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { ArrowUpRight, ChevronUp, MoreVertical, UserMinus } from 'lucide-react';
import { useState } from 'react';

import { TeamMemberActionModal } from '@/components/modals/team-member-action-modal';
import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { SectionError } from '@/components/shared/section-error';
import { TeamSectionSkeleton } from '@/components/skeleton';
import { WORKSPACE_MEMBERS_PAGINATION } from '@/constants';
import {
  useRemoveMember,
  useUpdateMemberRole,
  useWorkspaceMembers,
  useWorkspaceRole,
} from '@/features/workspace';
import { useWorkspaceId } from '@/stores/workspace';

const ITEMS_PER_PAGE = WORKSPACE_MEMBERS_PAGINATION.DEFAULT_PER_PAGE;

type ConfirmAction = {
  type: 'remove' | 'changeRole';
  memberId: string;
  memberName: string;
  memberEmail: string;
  currentRole?: 'owner' | 'admin' | 'member';
};

interface TeamSectionProps {
  onInviteClick?: () => void;
}

export function TeamSection({ onInviteClick }: TeamSectionProps) {
  const workspaceId = useWorkspaceId();
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const {
    data: membersResult,
    isLoading,
    error,
    refetch,
  } = useWorkspaceMembers({
    perPage: ITEMS_PER_PAGE,
    page: currentPage,
  });
  const members = membersResult?.success ? membersResult.data.workspaceMembers : null;
  const pagination = membersResult?.success ? membersResult.data.pagination : null;

  const { data: roleResult } = useWorkspaceRole();
  const myMemberId = roleResult?.success ? roleResult.data.workspaceMemberId : null;
  const myRole = roleResult?.success ? roleResult.data.workspaceRole : null;

  const updateRoleMutation = useUpdateMemberRole(workspaceId);
  const removeMemberMutation = useRemoveMember(workspaceId);

  const handleConfirmAction = (newRole?: 'owner' | 'admin' | 'member') => {
    if (!confirmAction) return;

    if (confirmAction.type === 'remove') {
      removeMemberMutation.mutate(confirmAction.memberId);
    } else if (confirmAction.type === 'changeRole' && newRole) {
      updateRoleMutation.mutate({ workspaceMemberId: confirmAction.memberId, newRole });
    }

    setConfirmAction(null);
  };

  if (isLoading) {
    return <TeamSectionSkeleton />;
  }

  if (error || (membersResult && !membersResult.success)) {
    return (
      <div className="max-w-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
        </div>
        <div>
          <SectionError
            title="Failed to load team members"
            description={
              error instanceof Error
                ? error.message
                : membersResult && !membersResult.success
                  ? membersResult.error.message
                  : 'Something went wrong while loading team members.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const displayedMembers = members || [];
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
      </div>

      <div>
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
              {displayedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                displayedMembers.map((member) => (
                  <TableRow key={member.workspaceMemberId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BoringAvatar
                          size={AVATAR_SIZES.USER}
                          name={member.memberName}
                          email={member.memberEmail}
                        />
                        <div>
                          <div className="font-medium text-sm">{member.memberName}</div>
                          <div className="text-xs text-muted-foreground">{member.memberEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{member.workspaceRole}</span>
                    </TableCell>
                    <TableCell>
                      {/* Only show actions if current user is admin or owner, and not modifying themselves */}
                      {(myRole === 'admin' || myRole === 'owner') &&
                      member.workspaceMemberId !== myMemberId ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  type: 'changeRole',
                                  memberId: member.workspaceMemberId,
                                  memberName: member.memberName,
                                  memberEmail: member.memberEmail,
                                  currentRole: member.workspaceRole,
                                })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>

                            {/* Both admin and owner can remove members (but not owners for admin) */}
                            {(myRole === 'owner' ||
                              (myRole === 'admin' && member.workspaceRole !== 'owner')) && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'remove',
                                    memberId: member.workspaceMemberId,
                                    memberName: member.memberName,
                                    memberEmail: member.memberEmail,
                                  })
                                }
                                disabled={removeMemberMutation.isPending}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {displayedMembers.length} members
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
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {onInviteClick && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={onInviteClick}
              className="text-sm text-muted-foreground underline hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Add more
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <TeamMemberActionModal
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        actionType={confirmAction?.type || null}
        memberName={confirmAction?.memberName || ''}
        memberEmail={confirmAction?.memberEmail || ''}
        currentRole={confirmAction?.currentRole}
        onConfirm={handleConfirmAction}
        isPending={updateRoleMutation.isPending || removeMemberMutation.isPending}
        canMakeOwner={myRole === 'owner'}
      />
    </div>
  );
}
