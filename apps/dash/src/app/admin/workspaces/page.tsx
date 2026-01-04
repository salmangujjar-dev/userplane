'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Input } from '@workspace/ui/components/input';
import { Search, Building2, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { WorkspaceCard } from '@/components/admin/workspace-card';
import { WorkspaceDetailSheet } from '@/components/admin/workspace-detail-sheet';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useSession } from '@/hooks/use-session';
import { useImpersonation } from '@/hooks/use-impersonation';
import {
  searchParser,
  pageParser,
  singleValueArrayParser,
  adminWorkspaceSortByParser,
  adminSortDirectionParser,
} from '@/lib/parsers';
import {
  useAdminSearchWorkspaces,
  useAdminWorkspaceDetail,
  useAdminWorkspaceMembers,
  useAdminDeactivateWorkspace,
  useAdminResetInviteToken,
} from '@/hooks/use-admin-workspace-api';
import { useAdminBanUser } from '@/hooks/use-admin-api';
import { AdminBanUserModal } from '@/components/modals/admin-ban-user-modal';
import { ImpersonateConfirmModal } from '@/components/modals/impersonate-confirm-modal';
import { AdminDeactivateWorkspaceModal } from '@/components/modals/admin-deactivate-workspace-modal';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';

const ITEMS_PER_PAGE = 10;
const MEMBERS_PER_PAGE = 5; // Max 5 per API limit

interface UserToAction {
  id: string;
  name: string;
  email: string;
}

interface WorkspaceToDeactivate {
  workspaceId: string;
  workspaceName: string;
}

interface WorkspaceToResetToken {
  workspaceId: string;
  workspaceName: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deactivated' },
];

const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'memberCount', label: 'Members' },
];

const SORT_DIRECTION_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

function WorkspaceCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

function AdminWorkspacesPageContent() {
  const router = useRouter();
  const { isAdmin, isPending: isSessionPending } = useSession();
  const [search, setSearch] = useQueryState('search', searchParser);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useQueryState('page', pageParser);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useQueryState('status', singleValueArrayParser);
  const [selectedSortBy, setSelectedSortBy] = useQueryState('sortBy', adminWorkspaceSortByParser);
  const [selectedSortDirection, setSelectedSortDirection] = useQueryState(
    'order',
    adminSortDirectionParser
  );

  // Members pagination
  const [membersPage, setMembersPage] = useState(0);

  // Modal states
  const [userToImpersonate, setUserToImpersonate] = useState<UserToAction | null>(null);
  const [userToBan, setUserToBan] = useState<UserToAction | null>(null);
  const [workspaceToDeactivate, setWorkspaceToDeactivate] = useState<WorkspaceToDeactivate | null>(
    null
  );
  const [workspaceToResetToken, setWorkspaceToResetToken] = useState<WorkspaceToResetToken | null>(
    null
  );

  // Hooks
  const { impersonateUser, isPending: isImpersonating } = useImpersonation();
  const banMutation = useAdminBanUser();
  const deactivateMutation = useAdminDeactivateWorkspace();
  const resetTokenMutation = useAdminResetInviteToken();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      void setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, setCurrentPage]);

  // Reset page when filters change
  useEffect(() => {
    void setCurrentPage(1);
  }, [selectedStatus, selectedSortBy, selectedSortDirection, setCurrentPage]);

  const { data: workspacesResult, isLoading: isLoadingWorkspaces } = useAdminSearchWorkspaces({
    search: debouncedSearch,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'memberCount' | undefined) || 'createdAt',
    sortDirection: (selectedSortDirection[0] as 'asc' | 'desc' | undefined) || 'desc',
    filterStatus: selectedStatus[0] as 'active' | 'deleted' | undefined,
    enabled: isAdmin,
  });

  const { data: workspaceDetailResult, isLoading: isLoadingWorkspaceDetail } =
    useAdminWorkspaceDetail(selectedWorkspaceId, isAdmin);

  const { data: workspaceMembersResult, isLoading: isLoadingWorkspaceMembers } =
    useAdminWorkspaceMembers({
      workspaceId: selectedWorkspaceId,
      limit: MEMBERS_PER_PAGE,
      offset: membersPage * MEMBERS_PER_PAGE,
      enabled: isAdmin && !!selectedWorkspaceId,
    });

  // Reset members page when workspace changes
  useEffect(() => {
    setMembersPage(0);
  }, [selectedWorkspaceId]);

  // Redirect non-admins
  useEffect(() => {
    if (!isSessionPending && !isAdmin) {
      router.replace('/');
    }
  }, [isSessionPending, isAdmin, router]);

  // Show loading while checking session
  if (isSessionPending) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 shrink-0">
          <div className="p-6">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-end gap-3 px-6 py-4" />
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <WorkspaceCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const workspaces = workspacesResult?.success ? workspacesResult.data.workspaces : [];
  const totalWorkspaces = workspacesResult?.success ? workspacesResult.data.total : 0;
  const totalPages = Math.ceil(totalWorkspaces / ITEMS_PER_PAGE);
  const workspaceDetail = workspaceDetailResult?.success ? workspaceDetailResult.data : null;
  const workspaceMembers = workspaceMembersResult?.success
    ? workspaceMembersResult.data.members
    : [];
  const workspaceMembersTotal = workspaceMembersResult?.success
    ? workspaceMembersResult.data.total
    : 0;

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId === selectedWorkspaceId ? null : workspaceId);
  };

  const handleDeactivate = (workspaceId: string, workspaceName: string) => {
    setWorkspaceToDeactivate({ workspaceId, workspaceName });
  };

  const confirmDeactivate = () => {
    if (workspaceToDeactivate) {
      deactivateMutation.mutate(
        { workspaceId: workspaceToDeactivate.workspaceId },
        { onSuccess: () => setWorkspaceToDeactivate(null) }
      );
    }
  };

  const handleResetInviteToken = (workspaceId: string, workspaceName: string) => {
    setWorkspaceToResetToken({ workspaceId, workspaceName });
  };

  const confirmResetInviteToken = () => {
    if (workspaceToResetToken) {
      resetTokenMutation.mutate(
        { workspaceId: workspaceToResetToken.workspaceId },
        { onSuccess: () => setWorkspaceToResetToken(null) }
      );
    }
  };

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

  const getSortDirectionIcon = () => {
    if (selectedSortDirection[0] === 'asc') return ArrowUp;
    if (selectedSortDirection[0] === 'desc') return ArrowDown;
    return ArrowUpDown;
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-6 py-4" />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Workspaces</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage userplane workspaces</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <FilterDropdown
                    label="Status"
                    options={STATUS_OPTIONS}
                    selected={selectedStatus}
                    onSelectionChange={setSelectedStatus}
                    placeholder="Filter status..."
                    icon={Building2}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Sort by"
                    options={SORT_BY_OPTIONS}
                    selected={selectedSortBy}
                    onSelectionChange={setSelectedSortBy}
                    placeholder="Sort by..."
                    icon={Clock}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Order"
                    options={SORT_DIRECTION_OPTIONS}
                    selected={selectedSortDirection}
                    onSelectionChange={setSelectedSortDirection}
                    placeholder="Sort order..."
                    icon={getSortDirectionIcon()}
                    singleSelect
                  />
                </div>
              </div>
            </div>

            {isLoadingWorkspaces ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <WorkspaceCardSkeleton key={i} />
                ))}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">
                  {debouncedSearch
                    ? 'No workspaces found matching your search'
                    : 'No workspaces found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.workspaceId}
                    workspaceName={workspace.workspaceName}
                    memberCount={workspace.memberCount}
                    projectCount={workspace.projectCount}
                    domainCount={workspace.domainCount}
                    linkCount={workspace.linkCount}
                    recordingCount={workspace.recordingCount}
                    isDeleted={workspace.isDeleted}
                    isSelected={selectedWorkspaceId === workspace.workspaceId}
                    onClick={() => handleSelectWorkspace(workspace.workspaceId)}
                    onDeactivate={() =>
                      handleDeactivate(workspace.workspaceId, workspace.workspaceName)
                    }
                    onResetInviteToken={() =>
                      handleResetInviteToken(workspace.workspaceId, workspace.workspaceName)
                    }
                  />
                ))}
              </div>
            )}

            {!isLoadingWorkspaces && workspaces.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Workspace Detail Sheet */}
      <WorkspaceDetailSheet
        open={!!selectedWorkspaceId}
        onOpenChange={(open) => !open && setSelectedWorkspaceId(null)}
        workspace={workspaceDetail}
        isLoading={isLoadingWorkspaceDetail}
        members={workspaceMembers}
        isLoadingMembers={isLoadingWorkspaceMembers}
        membersTotal={workspaceMembersTotal}
        membersPage={membersPage}
        membersPageSize={MEMBERS_PER_PAGE}
        onMembersPageChange={setMembersPage}
        onDeactivate={() =>
          workspaceDetail &&
          handleDeactivate(workspaceDetail.workspaceId, workspaceDetail.workspaceName)
        }
        onResetInviteToken={() =>
          workspaceDetail &&
          handleResetInviteToken(workspaceDetail.workspaceId, workspaceDetail.workspaceName)
        }
        onImpersonateUser={handleImpersonateUser}
        onBanUser={handleBanUser}
      />

      {/* Modals */}
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

      <AdminDeactivateWorkspaceModal
        open={!!workspaceToDeactivate}
        onOpenChange={(open) => !open && setWorkspaceToDeactivate(null)}
        workspace={workspaceToDeactivate}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
      />

      <ResetInviteTokenModal
        open={!!workspaceToResetToken}
        onOpenChange={(open) => !open && setWorkspaceToResetToken(null)}
        workspace={workspaceToResetToken}
        onConfirm={confirmResetInviteToken}
        isPending={resetTokenMutation.isPending}
      />
    </div>
  );
}

export default function AdminWorkspacesPage() {
  return (
    <Suspense fallback={<AdminWorkspacesPageSkeleton />}>
      <AdminWorkspacesPageContent />
    </Suspense>
  );
}

function AdminWorkspacesPageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 shrink-0">
        <div className="p-6">
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-6 py-4" />
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <WorkspaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
