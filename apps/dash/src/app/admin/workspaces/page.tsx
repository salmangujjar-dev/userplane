'use client';

import type {
  PlanId, // Used for create invite (includes all plans including sandbox/free)
} from '@workspace/pricing';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Clock } from 'lucide-react';
import { redirect, RedirectType, useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Suspense, useEffect, useReducer, useRef, useState } from 'react';

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

interface ProvisionResultData {
  checkoutUrl: string | null;
  workspaceUrl: string;
  workspaceId: string;
  workspaceName: string;
  userId: string;
  isNewUser: boolean;
}

interface ModalState {
  workspaceToDeactivate: WorkspaceToDeactivate | null;
  workspaceToRestore: WorkspaceToRestore | null;
  workspaceToResetToken: WorkspaceToResetToken | null;
  showCreateInviteModal: boolean;
  showInviteSuccessModal: boolean;
  inviteResult: AdminCreateWorkspaceInviteData | null;
  showProvisionModal: boolean;
  showProvisionSuccessModal: boolean;
  provisionResult: ProvisionResultData | null;
}

type ModalAction =
  | { type: 'SET_WORKSPACE_TO_DEACTIVATE'; payload: WorkspaceToDeactivate | null }
  | { type: 'SET_WORKSPACE_TO_RESTORE'; payload: WorkspaceToRestore | null }
  | { type: 'SET_WORKSPACE_TO_RESET_TOKEN'; payload: WorkspaceToResetToken | null }
  | { type: 'SHOW_CREATE_INVITE' }
  | { type: 'HIDE_CREATE_INVITE' }
  | { type: 'INVITE_SUCCESS'; payload: AdminCreateWorkspaceInviteData }
  | { type: 'SET_SHOW_INVITE_SUCCESS'; payload: boolean }
  | { type: 'SHOW_PROVISION' }
  | { type: 'HIDE_PROVISION' }
  | { type: 'PROVISION_SUCCESS'; payload: ProvisionResultData }
  | { type: 'SET_SHOW_PROVISION_SUCCESS'; payload: boolean };

const initialModalState: ModalState = {
  workspaceToDeactivate: null,
  workspaceToRestore: null,
  workspaceToResetToken: null,
  showCreateInviteModal: false,
  showInviteSuccessModal: false,
  inviteResult: null,
  showProvisionModal: false,
  showProvisionSuccessModal: false,
  provisionResult: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'SET_WORKSPACE_TO_DEACTIVATE':
      return { ...state, workspaceToDeactivate: action.payload };
    case 'SET_WORKSPACE_TO_RESTORE':
      return { ...state, workspaceToRestore: action.payload };
    case 'SET_WORKSPACE_TO_RESET_TOKEN':
      return { ...state, workspaceToResetToken: action.payload };
    case 'SHOW_CREATE_INVITE':
      return { ...state, showCreateInviteModal: true };
    case 'HIDE_CREATE_INVITE':
      return { ...state, showCreateInviteModal: false };
    case 'INVITE_SUCCESS':
      return {
        ...state,
        showCreateInviteModal: false,
        inviteResult: action.payload,
        showInviteSuccessModal: true,
      };
    case 'SET_SHOW_INVITE_SUCCESS':
      return { ...state, showInviteSuccessModal: action.payload };
    case 'SHOW_PROVISION':
      return { ...state, showProvisionModal: true };
    case 'HIDE_PROVISION':
      return { ...state, showProvisionModal: false };
    case 'PROVISION_SUCCESS':
      return {
        ...state,
        showProvisionModal: false,
        provisionResult: action.payload,
        showProvisionSuccessModal: true,
      };
    case 'SET_SHOW_PROVISION_SUCCESS':
      return { ...state, showProvisionSuccessModal: action.payload };
    default:
      return state;
  }
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

interface AdminWorkspacesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string[];
  onStatusChange: (value: string[]) => void;
  selectedSortBy: string[];
  onSortByChange: (value: string[]) => void;
  selectedSortDirection: string[];
  onSortDirectionChange: (value: string[]) => void;
  getSortDirectionIcon: () => typeof ArrowUpDown;
}

function AdminWorkspacesHeader({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedSortBy,
  onSortByChange,
  selectedSortDirection,
  onSortDirectionChange,
  getSortDirectionIcon,
}: AdminWorkspacesHeaderProps) {
  return (
    <div className="mb-6">
      <div>
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage userplane workspaces</p>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <SearchInput
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-80"
        />
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Status"
            options={ADMIN_WORKSPACE_STATUS_OPTIONS}
            selected={selectedStatus}
            onSelectionChange={onStatusChange}
            placeholder="Filter status..."
            icon={Building2}
            singleSelect
          />
          <FilterDropdown
            label="Sort by"
            options={ADMIN_WORKSPACE_SORT_OPTIONS}
            selected={selectedSortBy}
            onSelectionChange={onSortByChange}
            placeholder="Sort by..."
            icon={Clock}
            singleSelect
          />
          <FilterDropdown
            label="Order"
            options={SORT_DIRECTION_OPTIONS}
            selected={selectedSortDirection}
            onSelectionChange={onSortDirectionChange}
            placeholder="Sort order..."
            icon={getSortDirectionIcon()}
            singleSelect
          />
        </div>
      </div>
    </div>
  );
}

interface AdminWorkspacesListProps {
  isLoading: boolean;
  workspaces: {
    workspaceId: string;
    workspaceName: string;
    memberCount: number;
    projectCount: number;
    domainCount: number;
    linkCount: number;
    recordingCount: number;
    isDeleted: boolean;
  }[];
  searchQuery: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onDeactivate: (workspaceId: string, workspaceName: string) => void;
  onRestore: (workspaceId: string, workspaceName: string) => void;
  onResetInviteToken: (workspaceId: string, workspaceName: string) => void;
}

function AdminWorkspacesList({
  isLoading,
  workspaces,
  searchQuery,
  onSelectWorkspace,
  onDeactivate,
  onRestore,
  onResetInviteToken,
}: AdminWorkspacesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {searchQuery ? 'No workspaces found matching your search' : 'No workspaces found'}
        </p>
      </div>
    );
  }

  return (
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
          onClick={() => onSelectWorkspace(workspace.workspaceId)}
          onDeactivate={() => onDeactivate(workspace.workspaceId, workspace.workspaceName)}
          onRestore={() => onRestore(workspace.workspaceId, workspace.workspaceName)}
          onResetInviteToken={() =>
            onResetInviteToken(workspace.workspaceId, workspace.workspaceName)
          }
        />
      ))}
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

  // Ref to track previous debounced filters (avoids debouncedFilters in useEffect deps)
  const prevDebouncedRef = useRef(debouncedFilters);

  // Modal states (consolidated via reducer to avoid excessive useState and cascading setState)
  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  // Mutations
  const deactivateMutation = useAdminDeactivateWorkspace();
  const restoreMutation = useAdminRestoreWorkspace();
  const resetTokenMutation = useAdminResetInviteToken();

  const createInviteMutation = useAdminCreateWorkspaceInvite();
  const provisionMutation = useAdminWorkspaceProvision();

  // Debounce all filter changes (search, status, sort) together
  // Uses ref to compare previous filters, avoiding debouncedFilters in deps
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        search,
        status: (selectedStatus[0] as 'active' | 'deleted' | undefined) || 'active',
        sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'memberCount') || 'createdAt',
        sortDirection: (selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const prev = prevDebouncedRef.current;
      const filtersChanged =
        newFilters.search !== prev.search ||
        newFilters.status !== prev.status ||
        newFilters.sortBy !== prev.sortBy ||
        newFilters.sortDirection !== prev.sortDirection;

      if (filtersChanged) {
        prevDebouncedRef.current = newFilters;
        setDebouncedFilters(newFilters);
        void setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedSortBy, selectedSortDirection, setCurrentPage]);

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
    dispatch({ type: 'SET_WORKSPACE_TO_DEACTIVATE', payload: { workspaceId, workspaceName } });
  };

  const confirmDeactivate = (notify?: AdminNotifyDuration) => {
    if (modalState.workspaceToDeactivate) {
      deactivateMutation.mutate(
        { workspaceId: modalState.workspaceToDeactivate.workspaceId, notify },
        {
          onSuccess: () => dispatch({ type: 'SET_WORKSPACE_TO_DEACTIVATE', payload: null }),
        }
      );
    }
  };

  const handleRestore = (workspaceId: string, workspaceName: string) => {
    dispatch({ type: 'SET_WORKSPACE_TO_RESTORE', payload: { workspaceId, workspaceName } });
  };

  const confirmRestore = (notify?: AdminNotifyDuration) => {
    if (modalState.workspaceToRestore) {
      restoreMutation.mutate(
        { workspaceId: modalState.workspaceToRestore.workspaceId, notify },
        {
          onSuccess: () => dispatch({ type: 'SET_WORKSPACE_TO_RESTORE', payload: null }),
        }
      );
    }
  };

  const handleResetInviteToken = (workspaceId: string, workspaceName: string) => {
    dispatch({ type: 'SET_WORKSPACE_TO_RESET_TOKEN', payload: { workspaceId, workspaceName } });
  };

  const confirmResetInviteToken = () => {
    if (modalState.workspaceToResetToken) {
      resetTokenMutation.mutate(
        { workspaceId: modalState.workspaceToResetToken.workspaceId },
        {
          onSuccess: () => dispatch({ type: 'SET_WORKSPACE_TO_RESET_TOKEN', payload: null }),
        }
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
        if (result.success) {
          dispatch({ type: 'INVITE_SUCCESS', payload: result.data });
        } else {
          dispatch({ type: 'HIDE_CREATE_INVITE' });
        }
      },
    });
  };

  const handleProvision = (data: Parameters<typeof provisionMutation.mutate>[0]) => {
    provisionMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.success) {
          dispatch({ type: 'PROVISION_SUCCESS', payload: result.data });
        } else {
          dispatch({ type: 'HIDE_PROVISION' });
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
          onCreateInviteClick={() => dispatch({ type: 'SHOW_CREATE_INVITE' })}
          onProvisionClick={() => dispatch({ type: 'SHOW_PROVISION' })}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <AdminWorkspacesHeader
              search={search}
              onSearchChange={setSearch}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedSortBy={selectedSortBy}
              onSortByChange={setSelectedSortBy}
              selectedSortDirection={selectedSortDirection}
              onSortDirectionChange={setSelectedSortDirection}
              getSortDirectionIcon={getSortDirectionIcon}
            />

            <AdminWorkspacesList
              isLoading={isLoadingWorkspaces}
              workspaces={workspaces}
              searchQuery={debouncedFilters.search}
              onSelectWorkspace={handleSelectWorkspace}
              onDeactivate={handleDeactivate}
              onRestore={handleRestore}
              onResetInviteToken={handleResetInviteToken}
            />

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
        open={!!modalState.workspaceToDeactivate}
        onOpenChange={(open) =>
          !open && dispatch({ type: 'SET_WORKSPACE_TO_DEACTIVATE', payload: null })
        }
        workspace={modalState.workspaceToDeactivate}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
      />

      <AdminRestoreWorkspaceModal
        open={!!modalState.workspaceToRestore}
        onOpenChange={(open) =>
          !open && dispatch({ type: 'SET_WORKSPACE_TO_RESTORE', payload: null })
        }
        workspace={modalState.workspaceToRestore}
        onConfirm={confirmRestore}
        isPending={restoreMutation.isPending}
      />

      <ResetInviteTokenModal
        open={!!modalState.workspaceToResetToken}
        onOpenChange={(open) =>
          !open && dispatch({ type: 'SET_WORKSPACE_TO_RESET_TOKEN', payload: null })
        }
        workspace={modalState.workspaceToResetToken}
        onConfirm={confirmResetInviteToken}
        isPending={resetTokenMutation.isPending}
      />

      <AdminCreateWorkspaceInviteModal
        open={modalState.showCreateInviteModal}
        onOpenChange={(open) =>
          dispatch(open ? { type: 'SHOW_CREATE_INVITE' } : { type: 'HIDE_CREATE_INVITE' })
        }
        onSubmit={handleCreateInvite}
        isPending={createInviteMutation.isPending}
      />

      <AdminCreateWorkspaceInviteSuccessModal
        open={modalState.showInviteSuccessModal}
        onOpenChange={(open) => dispatch({ type: 'SET_SHOW_INVITE_SUCCESS', payload: open })}
        result={modalState.inviteResult}
      />

      <AdminProvisionWorkspaceModal
        open={modalState.showProvisionModal}
        onOpenChange={(open) =>
          dispatch(open ? { type: 'SHOW_PROVISION' } : { type: 'HIDE_PROVISION' })
        }
        onSubmit={handleProvision}
        isPending={provisionMutation.isPending}
      />

      <AdminProvisionWorkspaceSuccessModal
        open={modalState.showProvisionSuccessModal}
        onOpenChange={(open) => dispatch({ type: 'SET_SHOW_PROVISION_SUCCESS', payload: open })}
        result={modalState.provisionResult}
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
