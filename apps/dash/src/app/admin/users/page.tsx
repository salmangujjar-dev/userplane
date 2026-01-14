'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Input } from '@workspace/ui/components/input';
import { Search, UserCheck, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { UserCard } from '@/components/admin/user-card';
import { UserDetailSheet } from '@/components/admin/user-detail-sheet';
import { AdminBanUserModal } from '@/components/modals/admin-ban-user-modal';
import { AdminSessionsModal } from '@/components/modals/admin-sessions-modal';
import { AdminRevokeSessionModal } from '@/components/modals/admin-revoke-session-modal';
import { ImpersonateConfirmModal } from '@/components/modals/impersonate-confirm-modal';
import { AdminRevokeAllSessionsModal } from '@/components/modals/admin-revoke-all-sessions-modal';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useSession } from '@/hooks/use-session';
import { useImpersonation } from '@/hooks/use-impersonation';
import {
  searchParser,
  pageParser,
  singleValueArrayParser,
  adminUserSortByParser,
  adminSortDirectionParser,
} from '@/lib/parsers';
import {
  useAdminSearchUsers,
  useAdminUserDetail,
  useAdminUserSessions,
  useAdminUserWorkspaces,
  useAdminBanUser,
  useAdminUnbanUser,
  useAdminRevokeSession,
  useAdminRevokeAllSessions,
  type AdminUserSession,
} from '@/hooks/use-admin-api';

const ITEMS_PER_PAGE = 10;
const SESSIONS_PER_PAGE = 5;
const WORKSPACES_PER_PAGE = 10;

interface UserToAction {
  id: string;
  name: string;
  email: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
];

const SORT_DIRECTION_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

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

function AdminUsersPageContent() {
  const router = useRouter();
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

  // Sessions and workspaces pagination
  const [detailSessionsPage, setDetailSessionsPage] = useState(0);
  const [modalSessionsPage, setModalSessionsPage] = useState(0);
  const [detailWorkspacesPage, setDetailWorkspacesPage] = useState(0);

  // Modal states
  const [userToImpersonate, setUserToImpersonate] = useState<UserToAction | null>(null);
  const [userToBan, setUserToBan] = useState<UserToAction | null>(null);
  const [userForSessions, setUserForSessions] = useState<UserToAction | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminUserSession | null>(null);
  const [userToRevokeAllSessions, setUserToRevokeAllSessions] = useState<UserToAction | null>(null);

  // Hooks
  const { impersonateUser, isPending: isImpersonating } = useImpersonation();
  const banMutation = useAdminBanUser();
  const unbanMutation = useAdminUnbanUser();
  const revokeSessionMutation = useAdminRevokeSession();
  const revokeAllSessionsMutation = useAdminRevokeAllSessions();

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
    setDetailSessionsPage(0);
    setDetailWorkspacesPage(0);
  }, [selectedUserId]);

  useEffect(() => {
    setModalSessionsPage(0);
  }, [userForSessions?.id]);

  // Redirect users without admin access
  useEffect(() => {
    if (!isSessionPending && !hasAdminAccess) {
      router.replace('/');
    }
  }, [isSessionPending, hasAdminAccess, router]);

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
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
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
    setUserToImpersonate(user);
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
    setUserToBan(user);
  };

  const confirmBan = (options: { reason: string; expiresInSeconds?: number }) => {
    if (userToBan) {
      banMutation.mutate(
        { userId: userToBan.id, ...options },
        { onSuccess: () => setUserToBan(null) }
      );
    }
  };

  const handleUnban = (userId: string) => {
    unbanMutation.mutate({ userId });
  };

  const handleViewSessions = (user: UserToAction) => {
    setUserForSessions(user);
  };

  const handleRevokeSession = (sessionId: string) => {
    if (userForSessions) {
      revokeSessionMutation.mutate({ sessionId, userId: userForSessions.id });
    }
  };

  const handleRevokeAllSessions = (user: UserToAction) => {
    setUserToRevokeAllSessions(user);
  };

  const confirmRevokeAllSessions = () => {
    if (userToRevokeAllSessions) {
      revokeAllSessionsMutation.mutate(
        { userId: userToRevokeAllSessions.id },
        { onSuccess: () => setUserToRevokeAllSessions(null) }
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
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage userplane users</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
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
                    icon={UserCheck}
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

            {isLoadingUsers ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">
                  {debouncedFilters.search
                    ? 'No users found matching your search'
                    : 'No users found'}
                </p>
              </div>
            ) : (
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
                    onClick={() => handleSelectUser(user.id)}
                    onImpersonate={() =>
                      handleImpersonate({
                        id: user.id,
                        name: user.name || '',
                        email: user.email,
                      })
                    }
                    onViewSessions={() =>
                      handleViewSessions({
                        id: user.id,
                        name: user.name || '',
                        email: user.email,
                      })
                    }
                    onBan={() =>
                      handleBan({
                        id: user.id,
                        name: user.name || '',
                        email: user.email,
                      })
                    }
                    onUnban={() => handleUnban(user.id)}
                    onRevokeAllSessions={() =>
                      handleRevokeAllSessions({
                        id: user.id,
                        name: user.name || '',
                        email: user.email,
                      })
                    }
                    isCurrentUser={user.id === currentUser?.id}
                  />
                ))}
              </div>
            )}

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
        onWorkspacesPageChange={setDetailWorkspacesPage}
        sessions={selectedUserSessions}
        isLoadingSessions={isLoadingSelectedUserSessions}
        sessionsTotal={selectedUserSessionsTotal}
        sessionsPage={detailSessionsPage}
        sessionsPageSize={SESSIONS_PER_PAGE}
        onSessionsPageChange={setDetailSessionsPage}
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
        onRevokeSession={(session) => setSessionToRevoke(session)}
        isCurrentUser={userDetail?.id === currentUser?.id}
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

      <AdminSessionsModal
        open={!!userForSessions}
        onOpenChange={(open) => !open && setUserForSessions(null)}
        sessions={userSessions}
        isLoading={isLoadingSessions}
        sessionsTotal={userSessionsTotal}
        sessionsPage={modalSessionsPage}
        sessionsPageSize={SESSIONS_PER_PAGE}
        onSessionsPageChange={setModalSessionsPage}
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
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        session={sessionToRevoke}
        onConfirm={() => {
          if (sessionToRevoke && selectedUserId) {
            revokeSessionMutation.mutate(
              { sessionId: sessionToRevoke.id, userId: selectedUserId },
              { onSuccess: () => setSessionToRevoke(null) }
            );
          }
        }}
        isPending={revokeSessionMutation.isPending}
      />

      <AdminRevokeAllSessionsModal
        open={!!userToRevokeAllSessions}
        onOpenChange={(open) => !open && setUserToRevokeAllSessions(null)}
        user={userToRevokeAllSessions}
        onConfirm={confirmRevokeAllSessions}
        isPending={revokeAllSessionsMutation.isPending}
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
