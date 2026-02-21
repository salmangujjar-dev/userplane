'use client';

import type {
  PlanId, // Used for create invite (includes all plans including sandbox/free)
} from '@workspace/pricing';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, UserCheck } from 'lucide-react';
import { redirect, RedirectType } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Suspense, useEffect, useReducer, useRef, useState } from 'react';

import { UserCard } from '@/components/admin/user-card';
import { UserDetailSheet } from '@/components/admin/user-detail-sheet';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { AdminBanUserModal } from '@/components/modals/admin-ban-user-modal';
import {
  AdminCreateWorkspaceInviteModal,
  AdminCreateWorkspaceInviteSuccessModal,
} from '@/components/modals/admin-create-workspace-invite-modal';
import { AdminRevokeAllSessionsModal } from '@/components/modals/admin-revoke-all-sessions-modal';
import { AdminRevokeSessionModal } from '@/components/modals/admin-revoke-session-modal';
import { AdminSessionsModal } from '@/components/modals/admin-sessions-modal';
import { ImpersonateConfirmModal } from '@/components/modals/impersonate-confirm-modal';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { AdminTopActions } from '@/components/navigation/admin-top-actions';
import { PaginationControls } from '@/components/shared/pagination-controls';
import {
  ADMIN_USER_SESSIONS_PAGINATION,
  ADMIN_USER_SORT_OPTIONS,
  ADMIN_USER_STATUS_OPTIONS,
  ADMIN_USER_WORKSPACES_PAGINATION,
  ADMIN_USERS_PAGINATION,
  SORT_DIRECTION_OPTIONS,
} from '@/constants/admin';
import {
  useAdminBanUser,
  useAdminCreateWorkspaceInvite,
  useAdminRevokeAllSessions,
  useAdminRevokeSession,
  useAdminSearchUsers,
  useAdminUnbanUser,
  useAdminUserDetail,
  useAdminUserSessions,
  useAdminUserWorkspaces,
  useImpersonation,
} from '@/features/admin';
import { useSession } from '@/features/auth';
import {
  adminSortDirectionParser,
  adminUserSortByParser,
  pageParser,
  searchParser,
  singleValueArrayParser,
} from '@/lib/parsers';
import type { WorkspaceRole } from '@/types';
import type { AdminCreateWorkspaceInviteData, AdminUserSession } from '@/types';

const ITEMS_PER_PAGE = ADMIN_USERS_PAGINATION.DEFAULT_PER_PAGE;
const SESSIONS_PER_PAGE = ADMIN_USER_SESSIONS_PAGINATION.DEFAULT_PER_PAGE;
const WORKSPACES_PER_PAGE = ADMIN_USER_WORKSPACES_PAGINATION.DEFAULT_PER_PAGE;

interface UserToAction {
  id: string;
  name: string;
  email: string;
}

// ---- Reducers for grouped state ----

interface PaginationState {
  detailSessionsPage: number;
  modalSessionsPage: number;
  detailWorkspacesPage: number;
}

type PaginationAction =
  | { type: 'SET_DETAIL_SESSIONS_PAGE'; value: number }
  | { type: 'SET_MODAL_SESSIONS_PAGE'; value: number }
  | { type: 'SET_DETAIL_WORKSPACES_PAGE'; value: number }
  | { type: 'RESET_DETAIL_PAGES' };

const initialPaginationState: PaginationState = {
  detailSessionsPage: 0,
  modalSessionsPage: 0,
  detailWorkspacesPage: 0,
};

function paginationReducer(state: PaginationState, action: PaginationAction): PaginationState {
  switch (action.type) {
    case 'SET_DETAIL_SESSIONS_PAGE':
      return { ...state, detailSessionsPage: action.value };
    case 'SET_MODAL_SESSIONS_PAGE':
      return { ...state, modalSessionsPage: action.value };
    case 'SET_DETAIL_WORKSPACES_PAGE':
      return { ...state, detailWorkspacesPage: action.value };
    case 'RESET_DETAIL_PAGES':
      return { ...state, detailSessionsPage: 0, detailWorkspacesPage: 0 };
    default:
      return state;
  }
}

interface ModalState {
  userToImpersonate: UserToAction | null;
  userToBan: UserToAction | null;
  userForSessions: UserToAction | null;
  sessionToRevoke: AdminUserSession | null;
  userToRevokeAllSessions: UserToAction | null;
}

type ModalAction =
  | { type: 'SET_USER_TO_IMPERSONATE'; value: UserToAction | null }
  | { type: 'SET_USER_TO_BAN'; value: UserToAction | null }
  | { type: 'SET_USER_FOR_SESSIONS'; value: UserToAction | null }
  | { type: 'SET_SESSION_TO_REVOKE'; value: AdminUserSession | null }
  | { type: 'SET_USER_TO_REVOKE_ALL_SESSIONS'; value: UserToAction | null };

const initialModalState: ModalState = {
  userToImpersonate: null,
  userToBan: null,
  userForSessions: null,
  sessionToRevoke: null,
  userToRevokeAllSessions: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'SET_USER_TO_IMPERSONATE':
      return { ...state, userToImpersonate: action.value };
    case 'SET_USER_TO_BAN':
      return { ...state, userToBan: action.value };
    case 'SET_USER_FOR_SESSIONS':
      return { ...state, userForSessions: action.value };
    case 'SET_SESSION_TO_REVOKE':
      return { ...state, sessionToRevoke: action.value };
    case 'SET_USER_TO_REVOKE_ALL_SESSIONS':
      return { ...state, userToRevokeAllSessions: action.value };
    default:
      return state;
  }
}

interface InviteState {
  showCreateInviteModal: boolean;
  showInviteSuccessModal: boolean;
  inviteResult: AdminCreateWorkspaceInviteData | null;
}

type InviteAction =
  | { type: 'SHOW_CREATE_INVITE'; value: boolean }
  | { type: 'SHOW_INVITE_SUCCESS'; value: boolean }
  | { type: 'SET_INVITE_RESULT'; value: AdminCreateWorkspaceInviteData | null }
  | { type: 'INVITE_SUCCESS'; result: AdminCreateWorkspaceInviteData };

const initialInviteState: InviteState = {
  showCreateInviteModal: false,
  showInviteSuccessModal: false,
  inviteResult: null,
};

function inviteReducer(state: InviteState, action: InviteAction): InviteState {
  switch (action.type) {
    case 'SHOW_CREATE_INVITE':
      return { ...state, showCreateInviteModal: action.value };
    case 'SHOW_INVITE_SUCCESS':
      return { ...state, showInviteSuccessModal: action.value };
    case 'SET_INVITE_RESULT':
      return { ...state, inviteResult: action.value };
    case 'INVITE_SUCCESS':
      return {
        ...state,
        showCreateInviteModal: false,
        inviteResult: action.result,
        showInviteSuccessModal: true,
      };
    default:
      return state;
  }
}

function UserCardSkeleton() {
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

interface AdminUsersHeaderProps {
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

function AdminUsersHeader({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedSortBy,
  onSortByChange,
  selectedSortDirection,
  onSortDirectionChange,
  getSortDirectionIcon,
}: AdminUsersHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">Users</h2>
      <p className="text-sm text-muted-foreground mt-1">Manage userplane users</p>
      <div className="flex items-center gap-2 mt-3">
        <SearchInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-80"
        />
        <div className="flex items-center gap-2 ml-2">
          <FilterDropdown
            label="Status"
            options={ADMIN_USER_STATUS_OPTIONS}
            selected={selectedStatus}
            onSelectionChange={onStatusChange}
            placeholder="Filter status..."
            icon={UserCheck}
            singleSelect
          />
          <FilterDropdown
            label="Sort by"
            options={ADMIN_USER_SORT_OPTIONS}
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

interface AdminUsersListProps {
  isLoading: boolean;
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    workspaceCount: number;
    banned: boolean | null;
    banExpires: Date | null;
  }[];
  searchQuery: string;
  selectedUserId: string | null;
  currentUserId: string | undefined;
  onSelectUser: (userId: string) => void;
  onImpersonate: (user: UserToAction) => void;
  onViewSessions: (user: UserToAction) => void;
  onBan: (user: UserToAction) => void;
  onUnban: (userId: string) => void;
  onRevokeAllSessions: (user: UserToAction) => void;
}

function AdminUsersList({
  isLoading,
  users,
  searchQuery,
  selectedUserId,
  currentUserId,
  onSelectUser,
  onImpersonate,
  onViewSessions,
  onBan,
  onUnban,
  onRevokeAllSessions,
}: AdminUsersListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">
          {searchQuery ? 'No users found matching your search' : 'No users found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          name={user.name}
          email={user.email}
          role={user.role}
          workspaceCount={user.workspaceCount}
          banned={!!user.banned}
          banExpires={user.banExpires}
          isSelected={selectedUserId === user.id}
          onClick={() => onSelectUser(user.id)}
          onImpersonate={() =>
            onImpersonate({
              id: user.id,
              name: user.name || '',
              email: user.email,
            })
          }
          onViewSessions={() =>
            onViewSessions({
              id: user.id,
              name: user.name || '',
              email: user.email,
            })
          }
          onBan={() =>
            onBan({
              id: user.id,
              name: user.name || '',
              email: user.email,
            })
          }
          onUnban={() => onUnban(user.id)}
          onRevokeAllSessions={() =>
            onRevokeAllSessions({
              id: user.id,
              name: user.name || '',
              email: user.email,
            })
          }
          isCurrentUser={user.id === currentUserId}
        />
      ))}
    </div>
  );
}

function AdminUsersPageContent() {
  const { hasAdminAccess, isPending: isSessionPending, user: currentUser } = useSession();
  const [search, setSearch] = useQueryState('search', searchParser);
  const [currentPage, setCurrentPage] = useQueryState('page', pageParser);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filter states (URL-synced)
  const [selectedStatus, setSelectedStatus] = useQueryState('status', singleValueArrayParser);
  const [selectedSortBy, setSelectedSortBy] = useQueryState('sortBy', adminUserSortByParser);
  const [selectedSortDirection, setSelectedSortDirection] = useQueryState(
    'order',
    adminSortDirectionParser
  );

  // Debounced filter states for API calls
  const [debouncedFilters, setDebouncedFilters] = useState({
    search: '',
    status: selectedStatus[0] as 'active' | 'banned' | undefined,
    sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'email') || 'createdAt',
    sortDirection: (selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
  });

  // Sessions and workspaces pagination (grouped)
  const [pagination, dispatchPagination] = useReducer(paginationReducer, initialPaginationState);
  const { detailSessionsPage, modalSessionsPage, detailWorkspacesPage } = pagination;

  // Modal states (grouped)
  const [modals, dispatchModals] = useReducer(modalReducer, initialModalState);
  const {
    userToImpersonate,
    userToBan,
    userForSessions,
    sessionToRevoke,
    userToRevokeAllSessions,
  } = modals;

  // Invite modal state (grouped)
  const [invite, dispatchInvite] = useReducer(inviteReducer, initialInviteState);
  const { showCreateInviteModal, showInviteSuccessModal, inviteResult } = invite;

  // Hooks
  const { impersonateUser, isPending: isImpersonating } = useImpersonation();
  const banMutation = useAdminBanUser();
  const unbanMutation = useAdminUnbanUser();
  const revokeSessionMutation = useAdminRevokeSession();
  const revokeAllSessionsMutation = useAdminRevokeAllSessions();

  const createInviteMutation = useAdminCreateWorkspaceInvite();

  // Ref to track previous debounced filters for comparison without causing re-renders
  const prevDebouncedRef = useRef(debouncedFilters);

  // Debounce all filter changes (search, status, sort) together
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        search,
        status: selectedStatus[0] as 'active' | 'banned' | undefined,
        sortBy: (selectedSortBy[0] as 'createdAt' | 'name' | 'email') || 'createdAt',
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

  const { data: usersResult, isLoading: isLoadingUsers } = useAdminSearchUsers({
    search: debouncedFilters.search,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    sortBy: debouncedFilters.sortBy,
    sortDirection: debouncedFilters.sortDirection,
    filterStatus: debouncedFilters.status,
    enabled: hasAdminAccess,
  });

  const { data: userDetailResult, isLoading: isLoadingUserDetail } = useAdminUserDetail(
    selectedUserId,
    hasAdminAccess
  );

  // Sessions for the detail sheet (fetched when a user is selected)
  const { data: selectedUserSessionsResult, isLoading: isLoadingSelectedUserSessions } =
    useAdminUserSessions({
      userId: selectedUserId,
      limit: SESSIONS_PER_PAGE,
      offset: detailSessionsPage * SESSIONS_PER_PAGE,
      enabled: hasAdminAccess && !!selectedUserId,
    });

  // Workspaces for the detail sheet (fetched when a user is selected)
  const { data: selectedUserWorkspacesResult, isLoading: isLoadingSelectedUserWorkspaces } =
    useAdminUserWorkspaces({
      userId: selectedUserId,
      limit: WORKSPACES_PER_PAGE,
      offset: detailWorkspacesPage * WORKSPACES_PER_PAGE,
      enabled: hasAdminAccess && !!selectedUserId,
    });

  // Sessions for the sessions modal (fetched when viewing sessions)
  const { data: userSessionsResult, isLoading: isLoadingSessions } = useAdminUserSessions({
    userId: userForSessions?.id ?? null,
    limit: SESSIONS_PER_PAGE,
    offset: modalSessionsPage * SESSIONS_PER_PAGE,
    enabled: hasAdminAccess && !!userForSessions,
  });

  // Reset sessions and workspaces pages when user changes
  useEffect(() => {
    dispatchPagination({ type: 'RESET_DETAIL_PAGES' });
  }, [selectedUserId]);

  useEffect(() => {
    dispatchPagination({ type: 'SET_MODAL_SESSIONS_PAGE', value: 0 });
  }, [userForSessions?.id]);

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
          <AdminTopActions />
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <UserCardSkeleton key={i} />
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

  const users = usersResult?.success ? usersResult.data.users : [];
  const totalUsers = usersResult?.success ? usersResult.data.total : 0;
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);
  const userDetail = userDetailResult?.success ? userDetailResult.data : null;
  const selectedUserSessions = selectedUserSessionsResult?.success
    ? selectedUserSessionsResult.data.sessions
    : [];
  const selectedUserSessionsTotal = selectedUserSessionsResult?.success
    ? selectedUserSessionsResult.data.total
    : 0;
  const selectedUserWorkspaces = selectedUserWorkspacesResult?.success
    ? selectedUserWorkspacesResult.data.workspaces
    : [];
  const selectedUserWorkspacesTotal = selectedUserWorkspacesResult?.success
    ? selectedUserWorkspacesResult.data.total
    : 0;
  const userSessions = userSessionsResult?.success ? userSessionsResult.data.sessions : [];
  const userSessionsTotal = userSessionsResult?.success ? userSessionsResult.data.total : 0;

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  const handleImpersonate = (user: UserToAction) => {
    if (user.id === currentUser?.id) return;
    dispatchModals({ type: 'SET_USER_TO_IMPERSONATE', value: user });
  };

  const confirmImpersonate = () => {
    if (userToImpersonate) {
      impersonateUser({
        userId: userToImpersonate.id,
        userName: userToImpersonate.name || userToImpersonate.email,
      });
    }
  };

  const handleBan = (user: UserToAction) => {
    if (user.id === currentUser?.id) return;
    dispatchModals({ type: 'SET_USER_TO_BAN', value: user });
  };

  const confirmBan = (options: {
    reason: string;
    expiresInSeconds?: number;
    deleteWorkspacesForRoles?: WorkspaceRole[];
  }) => {
    if (userToBan) {
      banMutation.mutate(
        { userId: userToBan.id, ...options },
        { onSuccess: () => dispatchModals({ type: 'SET_USER_TO_BAN', value: null }) }
      );
    }
  };

  const handleUnban = (userId: string) => {
    unbanMutation.mutate({ userId });
  };

  const handleViewSessions = (user: UserToAction) => {
    dispatchModals({ type: 'SET_USER_FOR_SESSIONS', value: user });
  };

  const handleRevokeSession = (sessionId: string) => {
    if (userForSessions) {
      revokeSessionMutation.mutate({ sessionId, userId: userForSessions.id });
    }
  };

  const handleRevokeAllSessions = (user: UserToAction) => {
    dispatchModals({ type: 'SET_USER_TO_REVOKE_ALL_SESSIONS', value: user });
  };

  const confirmRevokeAllSessions = () => {
    if (userToRevokeAllSessions) {
      revokeAllSessionsMutation.mutate(
        { userId: userToRevokeAllSessions.id },
        {
          onSuccess: () => dispatchModals({ type: 'SET_USER_TO_REVOKE_ALL_SESSIONS', value: null }),
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
          dispatchInvite({ type: 'INVITE_SUCCESS', result: result.data });
        } else {
          dispatchInvite({ type: 'SHOW_CREATE_INVITE', value: false });
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
          onCreateInviteClick={() => dispatchInvite({ type: 'SHOW_CREATE_INVITE', value: true })}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <AdminUsersHeader
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

            <AdminUsersList
              isLoading={isLoadingUsers}
              users={users}
              searchQuery={debouncedFilters.search}
              selectedUserId={selectedUserId}
              currentUserId={currentUser?.id}
              onSelectUser={handleSelectUser}
              onImpersonate={handleImpersonate}
              onViewSessions={handleViewSessions}
              onBan={handleBan}
              onUnban={handleUnban}
              onRevokeAllSessions={handleRevokeAllSessions}
            />

            {!isLoadingUsers && users.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* User Detail Sheet */}
      <UserDetailSheet
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        user={userDetail}
        isLoading={isLoadingUserDetail}
        workspaces={selectedUserWorkspaces}
        isLoadingWorkspaces={isLoadingSelectedUserWorkspaces}
        workspacesTotal={selectedUserWorkspacesTotal}
        workspacesPage={detailWorkspacesPage}
        workspacesPageSize={WORKSPACES_PER_PAGE}
        onWorkspacesPageChange={(v: number) =>
          dispatchPagination({ type: 'SET_DETAIL_WORKSPACES_PAGE', value: v })
        }
        sessions={selectedUserSessions}
        isLoadingSessions={isLoadingSelectedUserSessions}
        sessionsTotal={selectedUserSessionsTotal}
        sessionsPage={detailSessionsPage}
        sessionsPageSize={SESSIONS_PER_PAGE}
        onSessionsPageChange={(v: number) =>
          dispatchPagination({ type: 'SET_DETAIL_SESSIONS_PAGE', value: v })
        }
        onImpersonate={() =>
          userDetail &&
          handleImpersonate({
            id: userDetail.id,
            name: userDetail.name || '',
            email: userDetail.email,
          })
        }
        onBan={() =>
          userDetail &&
          handleBan({
            id: userDetail.id,
            name: userDetail.name || '',
            email: userDetail.email,
          })
        }
        onUnban={() => userDetail && handleUnban(userDetail.id)}
        onRevokeSession={(session) =>
          dispatchModals({ type: 'SET_SESSION_TO_REVOKE', value: session })
        }
        isCurrentUser={userDetail?.id === currentUser?.id}
      />

      {/* Modals */}
      <ImpersonateConfirmModal
        open={!!userToImpersonate}
        onOpenChange={(open) =>
          !open && dispatchModals({ type: 'SET_USER_TO_IMPERSONATE', value: null })
        }
        user={userToImpersonate}
        onConfirm={confirmImpersonate}
        isPending={isImpersonating}
      />

      <AdminBanUserModal
        open={!!userToBan}
        onOpenChange={(open) => !open && dispatchModals({ type: 'SET_USER_TO_BAN', value: null })}
        user={userToBan}
        onConfirm={confirmBan}
        isPending={banMutation.isPending}
      />

      <AdminSessionsModal
        open={!!userForSessions}
        onOpenChange={(open) =>
          !open && dispatchModals({ type: 'SET_USER_FOR_SESSIONS', value: null })
        }
        sessions={userSessions}
        isLoading={isLoadingSessions}
        sessionsTotal={userSessionsTotal}
        sessionsPage={modalSessionsPage}
        sessionsPageSize={SESSIONS_PER_PAGE}
        onSessionsPageChange={(v: number) =>
          dispatchPagination({ type: 'SET_MODAL_SESSIONS_PAGE', value: v })
        }
        onRevokeSession={handleRevokeSession}
        onRevokeAll={() =>
          userForSessions &&
          handleRevokeAllSessions({
            id: userForSessions.id,
            name: userForSessions.name,
            email: userForSessions.email,
          })
        }
        isRevoking={revokeSessionMutation.isPending}
        isRevokingAll={revokeAllSessionsMutation.isPending}
      />

      <AdminRevokeSessionModal
        open={!!sessionToRevoke}
        onOpenChange={(open) =>
          !open && dispatchModals({ type: 'SET_SESSION_TO_REVOKE', value: null })
        }
        session={sessionToRevoke}
        onConfirm={() => {
          if (sessionToRevoke && selectedUserId) {
            revokeSessionMutation.mutate(
              { sessionId: sessionToRevoke.id, userId: selectedUserId },
              { onSuccess: () => dispatchModals({ type: 'SET_SESSION_TO_REVOKE', value: null }) }
            );
          }
        }}
        isPending={revokeSessionMutation.isPending}
      />

      <AdminRevokeAllSessionsModal
        open={!!userToRevokeAllSessions}
        onOpenChange={(open) =>
          !open && dispatchModals({ type: 'SET_USER_TO_REVOKE_ALL_SESSIONS', value: null })
        }
        user={userToRevokeAllSessions}
        onConfirm={confirmRevokeAllSessions}
        isPending={revokeAllSessionsMutation.isPending}
      />

      <AdminCreateWorkspaceInviteModal
        open={showCreateInviteModal}
        onOpenChange={(v) => dispatchInvite({ type: 'SHOW_CREATE_INVITE', value: v })}
        onSubmit={handleCreateInvite}
        isPending={createInviteMutation.isPending}
      />

      <AdminCreateWorkspaceInviteSuccessModal
        open={showInviteSuccessModal}
        onOpenChange={(v) => dispatchInvite({ type: 'SHOW_INVITE_SUCCESS', value: v })}
        result={inviteResult}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersPageSkeleton />}>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageSkeleton() {
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
              <div key={i} className="rounded-xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
