'use client';

import type {
  PlanId, // Used for create invite (includes all plans including sandbox/free)
} from '@workspace/pricing';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Clock } from 'lucide-react';
import { redirect, RedirectType, useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Suspense, useEffect, useState } from 'react';

import { WorkspaceCard } from '@/components/admin/workspace-card';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import {
  AdminCreateWorkspaceInviteModal,
  AdminCreateWorkspaceInviteSuccessModal,
} from '@/components/modals/admin-create-workspace-invite-modal';
import { AdminDeactivateWorkspaceModal } from '@/components/modals/admin-deactivate-workspace-modal';
import {
  AdminProvisionWorkspaceModal,
  AdminProvisionWorkspaceSuccessModal,
} from '@/components/modals/admin-provision-workspace-modal';
import { AdminRestoreWorkspaceModal } from '@/components/modals/admin-restore-workspace-modal';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { AdminTopActions } from '@/components/navigation/admin-top-actions';
import { PaginationControls } from '@/components/shared/pagination-controls';
import {
  ADMIN_WORKSPACE_SORT_OPTIONS,
  ADMIN_WORKSPACE_STATUS_OPTIONS,
  ADMIN_WORKSPACES_PAGINATION,
  SORT_DIRECTION_OPTIONS,
} from '@/constants/admin';
import {
  useAdminCreateWorkspaceInvite,
  useAdminDeactivateWorkspace,
  useAdminResetInviteToken,
  useAdminRestoreWorkspace,
  useAdminSearchWorkspaces,
  useAdminWorkspaceProvision,
} from '@/features/admin';
import { useSession } from '@/features/auth';
import {
  adminSortDirectionParser,
  adminWorkspaceSortByParser,
  pageParser,
  searchParser,
  singleValueArrayParser,
} from '@/lib/parsers';
import type { AdminNotifyDuration } from '@/types';
import type { AdminCreateWorkspaceInviteData } from '@/types';

const ITEMS_PER_PAGE = ADMIN_WORKSPACES_PAGINATION.DEFAULT_PER_PAGE;

interface WorkspaceToDeactivate {
  workspaceId: string;
  workspaceName: string;
}

interface WorkspaceToRestore {
  workspaceId: string;
  workspaceName: string;
}

interface WorkspaceToResetToken {
  workspaceId: string;
  workspaceName: string;
}

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

function AdminRecordingsPageContent() {
  const router = useRouter();
  const { hasAdminAccess, isPending: isSessionPending } = useSession();
  const [search, setSearch] = useQueryState('search', searchParser);
  const [currentPage, setCurrentPage] = useQueryState('page', pageParser);

  // Filter states (URL-synced)
  const [selectedStatus, setSelectedStatus] = useQueryState('status', singleValueArrayParser);
  const [selectedSortBy, setSelectedSortBy] = useQueryState('sortBy', adminWorkspaceSortByParser);
  const [selectedSortDirection, setSelectedSortDirection] = useQueryState(
    'order',
    adminSortDirectionParser
  );

  // Debounced filter states for API calls - default to active workspaces
  const [debouncedFilters, setDebouncedFilters] = useState({
    search: '',
    status: (selectedStatus[0] as 'active' | 'deleted' | undefined) || 'active',
    sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'memberCount') || 'createdAt',
    sortDirection: (selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
  });

  // Modal states
  const [workspaceToDeactivate, setWorkspaceToDeactivate] = useState<WorkspaceToDeactivate | null>(
    null
  );
  const [workspaceToRestore, setWorkspaceToRestore] = useState<WorkspaceToRestore | null>(null);
  const [workspaceToResetToken, setWorkspaceToResetToken] = useState<WorkspaceToResetToken | null>(
    null
  );

  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false);
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<AdminCreateWorkspaceInviteData | null>(null);

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showProvisionSuccessModal, setShowProvisionSuccessModal] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{
    checkoutUrl: string | null;
    workspaceUrl: string;
    workspaceId: string;
    workspaceName: string;
    userId: string;
    isNewUser: boolean;
  } | null>(null);

  // Mutations
  const deactivateMutation = useAdminDeactivateWorkspace();
  const restoreMutation = useAdminRestoreWorkspace();
  const resetTokenMutation = useAdminResetInviteToken();

  const createInviteMutation = useAdminCreateWorkspaceInvite();
  const provisionMutation = useAdminWorkspaceProvision();

  // Debounce all filter changes (search, status, sort) together
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        search,
        status: (selectedStatus[0] as 'active' | 'deleted' | undefined) || 'active',
        sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'memberCount') || 'createdAt',
        sortDirection: (selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        newFilters.search !== debouncedFilters.search ||
        newFilters.status !== debouncedFilters.status ||
        newFilters.sortBy !== debouncedFilters.sortBy ||
        newFilters.sortDirection !== debouncedFilters.sortDirection;

      if (filtersChanged) {
        setDebouncedFilters(newFilters);
        void setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedStatus,
    selectedSortBy,
    selectedSortDirection,
    debouncedFilters,
    setCurrentPage,
  ]);

  // Fetch workspaces
  const { data: workspacesResult, isLoading: isLoadingWorkspaces } = useAdminSearchWorkspaces({
    search: debouncedFilters.search,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    sortBy: debouncedFilters.sortBy,
    sortDirection: debouncedFilters.sortDirection,
    filterStatus: debouncedFilters.status,
    enabled: hasAdminAccess,
  });

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

  // Redirect users without admin access
  if (!hasAdminAccess) {
    redirect('/', RedirectType.replace);
  }

  const workspaces = workspacesResult?.success ? workspacesResult.data.workspaces : [];
  const totalWorkspaces = workspacesResult?.success ? workspacesResult.data.total : 0;
  const totalPages = Math.ceil(totalWorkspaces / ITEMS_PER_PAGE);

  const handleSelectWorkspace = (workspaceId: string) => {
    router.push(`/admin/workspaces/${workspaceId}`);
  };

  const handleDeactivate = (workspaceId: string, workspaceName: string) => {
    setWorkspaceToDeactivate({ workspaceId, workspaceName });
  };

  const confirmDeactivate = (notify?: AdminNotifyDuration) => {
    if (workspaceToDeactivate) {
      deactivateMutation.mutate(
        { workspaceId: workspaceToDeactivate.workspaceId, notify },
        { onSuccess: () => setWorkspaceToDeactivate(null) }
      );
    }
  };

  const handleRestore = (workspaceId: string, workspaceName: string) => {
    setWorkspaceToRestore({ workspaceId, workspaceName });
  };

  const confirmRestore = (notify?: AdminNotifyDuration) => {
    if (workspaceToRestore) {
      restoreMutation.mutate(
        { workspaceId: workspaceToRestore.workspaceId, notify },
        { onSuccess: () => setWorkspaceToRestore(null) }
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

  /**
   * Handle workspace invite creation
   * Uses PlanId - includes all plans (sandbox, free, user-selectable)
   */
  const handleCreateInvite = (data: { workspaceUrl: string; plan?: PlanId }) => {
    createInviteMutation.mutate(data, {
      onSuccess: (result) => {
        setShowCreateInviteModal(false);
        if (result.success) {
          setInviteResult(result.data);
          setShowInviteSuccessModal(true);
        }
      },
    });
  };

  const handleProvision = (data: Parameters<typeof provisionMutation.mutate>[0]) => {
    provisionMutation.mutate(data, {
      onSuccess: (result) => {
        setShowProvisionModal(false);
        if (result.success) {
          setProvisionResult(result.data);
          setShowProvisionSuccessModal(true);
        }
      },
    });
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
        <AdminTopActions
          onCreateInviteClick={() => setShowCreateInviteModal(true)}
          onProvisionClick={() => setShowProvisionModal(true)}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <div className="mb-6">
              <div>
                <h2 className="text-lg font-semibold">Workspaces</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage userplane workspaces</p>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <SearchInput
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80"
                />
                <div className="flex items-center gap-2">
                  <FilterDropdown
                    label="Status"
                    options={ADMIN_WORKSPACE_STATUS_OPTIONS}
                    selected={selectedStatus}
                    onSelectionChange={setSelectedStatus}
                    placeholder="Filter status..."
                    icon={Building2}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Sort by"
                    options={ADMIN_WORKSPACE_SORT_OPTIONS}
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
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {debouncedFilters.search
                    ? 'No workspaces found matching your search'
                    : 'No workspaces found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.workspaceId}
                    workspaceId={workspace.workspaceId}
                    workspaceName={workspace.workspaceName}
                    memberCount={workspace.memberCount}
                    projectCount={workspace.projectCount}
                    domainCount={workspace.domainCount}
                    linkCount={workspace.linkCount}
                    recordingCount={workspace.recordingCount}
                    isDeleted={workspace.isDeleted}
                    onClick={() => handleSelectWorkspace(workspace.workspaceId)}
                    onDeactivate={() =>
                      handleDeactivate(workspace.workspaceId, workspace.workspaceName)
                    }
                    onRestore={() => handleRestore(workspace.workspaceId, workspace.workspaceName)}
                    onResetInviteToken={() =>
                      handleResetInviteToken(workspace.workspaceId, workspace.workspaceName)
                    }
                  />
                ))}
              </div>
            )}

            {!isLoadingWorkspaces && totalWorkspaces > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AdminDeactivateWorkspaceModal
        open={!!workspaceToDeactivate}
        onOpenChange={(open) => !open && setWorkspaceToDeactivate(null)}
        workspace={workspaceToDeactivate}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
      />

      <AdminRestoreWorkspaceModal
        open={!!workspaceToRestore}
        onOpenChange={(open) => !open && setWorkspaceToRestore(null)}
        workspace={workspaceToRestore}
        onConfirm={confirmRestore}
        isPending={restoreMutation.isPending}
      />

      <ResetInviteTokenModal
        open={!!workspaceToResetToken}
        onOpenChange={(open) => !open && setWorkspaceToResetToken(null)}
        workspace={workspaceToResetToken}
        onConfirm={confirmResetInviteToken}
        isPending={resetTokenMutation.isPending}
      />

      <AdminCreateWorkspaceInviteModal
        open={showCreateInviteModal}
        onOpenChange={setShowCreateInviteModal}
        onSubmit={handleCreateInvite}
        isPending={createInviteMutation.isPending}
      />

      <AdminCreateWorkspaceInviteSuccessModal
        open={showInviteSuccessModal}
        onOpenChange={setShowInviteSuccessModal}
        result={inviteResult}
      />

      <AdminProvisionWorkspaceModal
        open={showProvisionModal}
        onOpenChange={setShowProvisionModal}
        onSubmit={handleProvision}
        isPending={provisionMutation.isPending}
      />

      <AdminProvisionWorkspaceSuccessModal
        open={showProvisionSuccessModal}
        onOpenChange={setShowProvisionSuccessModal}
        result={provisionResult}
      />
    </div>
  );
}

export default function AdminRecordingsPage() {
  return (
    <Suspense fallback={<AdminRecordingsPageSkeleton />}>
      <AdminRecordingsPageContent />
    </Suspense>
  );
}

function AdminRecordingsPageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 shrink-0">
        <div className="p-6">
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopActions />
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
