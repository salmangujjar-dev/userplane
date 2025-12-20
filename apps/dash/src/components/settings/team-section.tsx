'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { MoreVertical, UserMinus, Shield } from 'lucide-react';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

const ITEMS_PER_PAGE = 5;

export function TeamSection() {
  const workspaceId = useWorkspaceId();
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useWorkspaceMembers({
    includeMe: true,
    perPage: ITEMS_PER_PAGE,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      workspaceMemberId,
      newRole,
    }: {
      workspaceMemberId: string;
      newRole: 'admin' | 'member';
    }) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.members.updateRole({
        params: { workspaceId, workspaceMemberId },
        body: { role: newRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Member role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member role: ${error.message}`);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (workspaceMemberId: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.members.remove({
        params: { workspaceId, workspaceMemberId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Member removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  const handleChangeRole = (workspaceMemberId: string, currentRole: string) => {
    if (currentRole === 'owner') {
      toast.error('Cannot change owner role');
      return;
    }
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    updateRoleMutation.mutate({ workspaceMemberId, newRole });
  };

  const handleRemoveMember = (workspaceMemberId: string, role: string) => {
    if (role === 'owner') {
      toast.error('Cannot remove workspace owner');
      return;
    }
    removeMemberMutation.mutate(workspaceMemberId);
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
        </div>
        <div className="max-w-2xl">
          <div className="rounded-xl border bg-card p-4">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayedMembers = members || [];
  const totalPages = 1;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
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
                        <BoringAvatar size={32} name={member.memberEmail} />
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.workspaceRole !== 'owner' && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeRole(member.workspaceMemberId, member.workspaceRole)
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {member.workspaceRole === 'admin' ? 'Make Member' : 'Make Admin'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleRemoveMember(member.workspaceMemberId, member.workspaceRole)
                            }
                            disabled={
                              member.workspaceRole === 'owner' || removeMemberMutation.isPending
                            }
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
