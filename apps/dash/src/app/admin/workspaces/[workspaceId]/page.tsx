'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Upload, Play, Video, Calendar, UserCog, Ban, MoreVertical } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useImpersonation } from '@/hooks/use-impersonation';
import {
  useAdminWorkspaceRecordingStats,
  useAdminWorkspaceMemberRecordingStats,
} from '@/hooks/use-admin-recording-api';
import {
  useAdminWorkspaceDetail,
  useAdminWorkspaceMembers,
  useAdminDeactivateWorkspace,
  useAdminResetInviteToken,
} from '@/hooks/use-admin-workspace-api';
import { useAdminBanUser } from '@/hooks/use-admin-api';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';
import {
  adminUploadStatusParser,
  adminStreamingStatusParser,
  adminRecordingStatusParser,
  adminRecordingWeeksParser,
  tabParser,
} from '@/lib/parsers';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { AdminBanUserModal } from '@/components/modals/admin-ban-user-modal';
import { ImpersonateConfirmModal } from '@/components/modals/impersonate-confirm-modal';
import { AdminDeactivateWorkspaceModal } from '@/components/modals/admin-deactivate-workspace-modal';
import { ResetInviteTokenModal } from '@/components/modals/reset-invite-token-modal';
import { DEFAULT_PLAN_NAME } from '@workspace/pricing';

const UPLOAD_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
];

const STREAMING_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
];

const DELETED_STATUS_OPTIONS = [
  { value: 'all', label: 'All Recordings' },
  { value: 'active', label: 'Active Only' },
  { value: 'deleted', label: 'Deleted Only' },
];

const WEEKS_TO_SHOW_OPTIONS = [
  { value: '12', label: '12 Weeks' },
  { value: '24', label: '24 Weeks' },
  { value: '36', label: '36 Weeks' },
  { value: '48', label: '48 Weeks' },
];

function formatWeekLabel(week: string): string {
  const date = new Date(week);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const chartConfig = {
  recordingCount: {
    label: 'Recording Count',
    color: 'hsl(var(--chart-1))',
  },
  durationMinutes: {
    label: 'Duration (minutes)',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const MEMBERS_PER_PAGE = 5;

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

function WorkspaceRecordingStatsPageContent() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { isAdmin, isPending: isSessionPending } = useSession();

  const [selectedUploadStatus, setSelectedUploadStatus] = useQueryState(
    'upload',
    adminUploadStatusParser
  );
  const [selectedStreamingStatus, setSelectedStreamingStatus] = useQueryState(
    'streaming',
    adminStreamingStatusParser
  );
  const [selectedDeletedStatus, setSelectedDeletedStatus] = useQueryState(
    'status',
    adminRecordingStatusParser
  );
  const [selectedWeeksToShow, setSelectedWeeksToShow] = useQueryState(
    'weeks',
    adminRecordingWeeksParser
  );
  const [activeChart, setActiveChart] = useState<'recordingCount' | 'durationMinutes'>(
    'recordingCount'
  );
  const [activePieChart, setActivePieChart] = useState<'recordingCount' | 'durationMinutes'>(
    'recordingCount'
  );

  // Tab state
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('overview'));

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

  const { data: statsResult, isLoading: isLoadingStats } = useAdminWorkspaceRecordingStats(
    workspaceId,
    {
      filterUploadStatus: selectedUploadStatus[0] as
        | 'pending'
        | 'available'
        | 'expired'
        | 'purged'
        | undefined,
      filterStreamingStatus: selectedStreamingStatus[0] as
        | 'pending'
        | 'available'
        | 'failed'
        | 'expired'
        | 'purged'
        | undefined,
      filterDeleted: selectedDeletedStatus[0] as 'all' | 'active' | 'deleted' | undefined,
      weeksToShow: selectedWeeksToShow[0] as '12' | '24' | '36' | '48' | undefined,
    }
  );

  const { data: memberStatsResult, isLoading: isLoadingMemberStats } =
    useAdminWorkspaceMemberRecordingStats(workspaceId, {
      filterUploadStatus: selectedUploadStatus[0] as
        | 'pending'
        | 'available'
        | 'expired'
        | 'purged'
        | undefined,
      filterStreamingStatus: selectedStreamingStatus[0] as
        | 'pending'
        | 'available'
        | 'failed'
        | 'expired'
        | 'purged'
        | undefined,
      filterDeleted: selectedDeletedStatus[0] as 'all' | 'active' | 'deleted' | undefined,
    });

  const { data: workspaceDetailResult, isLoading: isLoadingWorkspaceDetail } =
    useAdminWorkspaceDetail(workspaceId, isAdmin);

  const { data: workspaceMembersResult, isLoading: isLoadingWorkspaceMembers } =
    useAdminWorkspaceMembers({
      workspaceId,
      limit: MEMBERS_PER_PAGE,
      offset: membersPage * MEMBERS_PER_PAGE,
      enabled: isAdmin,
    });

  const stats = statsResult?.success ? statsResult.data : null;
  const memberStats = memberStatsResult?.success ? memberStatsResult.data : null;
  const workspaceDetail = workspaceDetailResult?.success ? workspaceDetailResult.data : null;
  const workspaceMembers = workspaceMembersResult?.success
    ? workspaceMembersResult.data.members
    : [];
  const workspaceMembersTotal = workspaceMembersResult?.success
    ? workspaceMembersResult.data.total
    : 0;

  const chartData = useMemo(() => {
    if (!stats?.weeklyStats) return [];
    return stats.weeklyStats.map((stat) => ({
      week: formatWeekLabel(stat.week),
      recordingCount: stat.recordingCount,
      durationMinutes: Number((stat.totalDuration / (1000 * 60)).toFixed(2)),
    }));
  }, [stats?.weeklyStats]);

  const total = useMemo(() => {
    if (!chartData.length) return { recordingCount: 0, durationMinutes: 0 };
    return {
      recordingCount: chartData.reduce((acc, curr) => acc + curr.recordingCount, 0),
      durationMinutes: chartData.reduce((acc, curr) => acc + curr.durationMinutes, 0),
    };
  }, [chartData]);

  const pieChartData = useMemo(() => {
    if (!memberStats?.memberStats) return [];
    return memberStats.memberStats.map((member) => ({
      name: member.memberName,
      recordingCount: member.recordingCount,
      durationMinutes: Number((member.totalDuration / (1000 * 60)).toFixed(2)),
      fill: PIE_COLORS[memberStats.memberStats.indexOf(member) % PIE_COLORS.length],
    }));
  }, [memberStats?.memberStats]);

  const pieTotal = useMemo(() => {
    if (!pieChartData.length) return { recordingCount: 0, durationMinutes: 0 };
    return {
      recordingCount: pieChartData.reduce((acc, curr) => acc + curr.recordingCount, 0),
      durationMinutes: pieChartData.reduce((acc, curr) => acc + curr.durationMinutes, 0),
    };
  }, [pieChartData]);

  useEffect(() => {
    if (!isSessionPending && !isAdmin) {
      router.replace('/');
    }
  }, [isSessionPending, isAdmin, router]);

  const handleDeactivate = () => {
    if (workspaceDetail) {
      setWorkspaceToDeactivate({ workspaceId, workspaceName: workspaceDetail.workspaceName });
    }
  };

  const confirmDeactivate = () => {
    if (workspaceToDeactivate) {
      deactivateMutation.mutate(
        { workspaceId: workspaceToDeactivate.workspaceId },
        { onSuccess: () => setWorkspaceToDeactivate(null) }
      );
    }
  };

  const handleResetInviteToken = () => {
    if (workspaceDetail) {
      setWorkspaceToResetToken({ workspaceId, workspaceName: workspaceDetail.workspaceName });
    }
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

  if (isSessionPending) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 shrink-0">
          <div className="p-6">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-6 py-4" />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Workspace Overview</h2>
            <p className="text-sm text-muted-foreground">Manage workspace settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stats">Workspace Stats</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="recordings">Recording Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {isLoadingWorkspaceDetail ? (
                <div className="w-full max-w-2xl space-y-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : workspaceDetail ? (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="workspace-name">Workspace Name</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        The name of the workspace
                      </p>
                    </div>
                    <Input
                      id="workspace-name"
                      value={workspaceDetail.workspaceName}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="pricing-plan">Pricing Plan</Label>
                      <p className="text-sm text-muted-foreground mt-1">The current pricing plan</p>
                    </div>
                    <Input
                      id="pricing-plan"
                      value={workspaceDetail.workspacePlanName || DEFAULT_PLAN_NAME}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="workspace-status">Workspace Status</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current status of the workspace
                      </p>
                    </div>
                    <Input
                      id="workspace-status"
                      value={workspaceDetail.isDeleted ? 'Deactivated' : 'Active'}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Reset invite token for workspace</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate a new invite token and invalidate the old one
                      </p>
                    </div>
                    <Button
                      onClick={handleResetInviteToken}
                      disabled={workspaceDetail.isDeleted}
                      className="ml-4 w-28"
                    >
                      Reset
                    </Button>
                  </div>

                  {!workspaceDetail.isDeleted && (
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Deactivate workspace</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Disable this workspace and prevent all access
                        </p>
                      </div>
                      <Button onClick={handleDeactivate} className="ml-4 w-28">
                        Deactivate
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="stats" className="space-y-8">
              {isLoadingWorkspaceDetail ? (
                <div className="w-full max-w-2xl space-y-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : workspaceDetail ? (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="project-count">Projects</Label>
                      <p className="text-sm text-muted-foreground mt-1">Total number of projects</p>
                    </div>
                    <Input
                      id="project-count"
                      value={workspaceDetail.projectCount.toString()}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="domain-count">Domains</Label>
                      <p className="text-sm text-muted-foreground mt-1">Total number of domains</p>
                    </div>
                    <Input
                      id="domain-count"
                      value={workspaceDetail.domainCount.toString()}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="link-count">Links</Label>
                      <p className="text-sm text-muted-foreground mt-1">Total number of links</p>
                    </div>
                    <Input
                      id="link-count"
                      value={workspaceDetail.linkCount.toString()}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="recording-count">Recordings</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total number of recordings
                      </p>
                    </div>
                    <Input
                      id="recording-count"
                      value={workspaceDetail.recordingCount.toString()}
                      readOnly
                      disabled
                      className="max-w-md bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="members" className="space-y-8">
              {/* Workspace Members */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Members</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage workspace members and permissions
                  </p>
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
                            <TableCell
                              colSpan={3}
                              className="text-center py-8 text-muted-foreground"
                            >
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
                                    <div className="text-xs text-muted-foreground">
                                      {member.userEmail}
                                    </div>
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
                                    >
                                      <UserCog className="h-4 w-4 mr-2" />
                                      Impersonate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleBanUser(
                                          member.userId,
                                          member.userName,
                                          member.userEmail
                                        )
                                      }
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
                        totalPages={Math.max(
                          1,
                          Math.ceil(workspaceMembersTotal / MEMBERS_PER_PAGE)
                        )}
                        onPageChange={(page) => setMembersPage(page - 1)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recordings" className="space-y-8">
              {/* Recording Statistics */}
              <div className="max-w-4xl">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Recording Statistics</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recording metrics and analytics for this workspace
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3 mb-6 flex-wrap">
                  <FilterDropdown
                    label="Time Range"
                    options={WEEKS_TO_SHOW_OPTIONS}
                    selected={selectedWeeksToShow}
                    onSelectionChange={setSelectedWeeksToShow}
                    placeholder="Time range..."
                    icon={Calendar}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Status"
                    options={DELETED_STATUS_OPTIONS}
                    selected={selectedDeletedStatus}
                    onSelectionChange={setSelectedDeletedStatus}
                    placeholder="Recording status..."
                    icon={Video}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Upload"
                    options={UPLOAD_STATUS_OPTIONS}
                    selected={selectedUploadStatus}
                    onSelectionChange={setSelectedUploadStatus}
                    placeholder="Upload status..."
                    icon={Upload}
                    singleSelect
                  />
                  <FilterDropdown
                    label="Streaming"
                    options={STREAMING_STATUS_OPTIONS}
                    selected={selectedStreamingStatus}
                    onSelectionChange={setSelectedStreamingStatus}
                    placeholder="Streaming status..."
                    icon={Play}
                    singleSelect
                  />
                </div>

                {/* Charts */}
                <div className="space-y-6">
                  {isLoadingStats ? (
                    <Card className="shadow-none">
                      <CardHeader>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                      </CardContent>
                    </Card>
                  ) : chartData.length > 0 ? (
                    <Card className="shadow-none">
                      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                          <CardTitle>Weekly Recording Stats</CardTitle>
                          <CardDescription>
                            Showing total{' '}
                            {activeChart === 'recordingCount'
                              ? 'recording count'
                              : 'duration in minutes'}{' '}
                            for the last {selectedWeeksToShow[0] || '12'} weeks
                          </CardDescription>
                        </div>
                        <div className="flex">
                          {(['recordingCount', 'durationMinutes'] as const).map((key) => {
                            const chart = key;
                            return (
                              <button
                                key={chart}
                                data-active={activeChart === chart}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                                onClick={() => setActiveChart(chart)}
                              >
                                <span className="text-xs text-muted-foreground">
                                  {chartConfig[chart].label}
                                </span>
                                <span className="text-lg font-bold leading-none sm:text-3xl">
                                  {key === 'recordingCount'
                                    ? total.recordingCount.toLocaleString()
                                    : `${total.durationMinutes.toFixed(0)} min`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardHeader>
                      <CardContent className="px-2 sm:p-6">
                        <ChartContainer
                          config={chartConfig}
                          className="aspect-auto h-[350px] w-full"
                        >
                          <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                              left: 12,
                              right: 12,
                            }}
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="week"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={32}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  className="w-[150px]"
                                  labelFormatter={(value) => value}
                                />
                              }
                            />
                            <Bar
                              dataKey={activeChart}
                              fill={`var(--color-${activeChart})`}
                              radius={4}
                            />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-none">
                      <CardContent className="h-[350px] flex flex-col items-center justify-center text-muted-foreground">
                        <Video className="h-12 w-12 mb-3" />
                        <p>No recording data available for this period</p>
                      </CardContent>
                    </Card>
                  )}

                  {isLoadingMemberStats ? (
                    <Card className="shadow-none">
                      <CardHeader>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                      </CardContent>
                    </Card>
                  ) : pieChartData.length > 0 ? (
                    <Card className="shadow-none">
                      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                          <CardTitle>Member Recording Distribution</CardTitle>
                          <CardDescription>
                            Showing{' '}
                            {activePieChart === 'recordingCount'
                              ? 'recording count'
                              : 'duration in minutes'}{' '}
                            by workspace member
                          </CardDescription>
                        </div>
                        <div className="flex">
                          {(['recordingCount', 'durationMinutes'] as const).map((key) => {
                            const chart = key;
                            return (
                              <button
                                key={chart}
                                data-active={activePieChart === chart}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                                onClick={() => setActivePieChart(chart)}
                              >
                                <span className="text-xs text-muted-foreground">
                                  {chartConfig[chart].label}
                                </span>
                                <span className="text-lg font-bold leading-none sm:text-3xl">
                                  {key === 'recordingCount'
                                    ? pieTotal.recordingCount.toLocaleString()
                                    : `${pieTotal.durationMinutes.toFixed(0)} min`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 pb-0">
                        <ChartContainer
                          config={chartConfig}
                          className="mx-auto aspect-square max-h-[350px]"
                        >
                          <PieChart>
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                  formatter={(value, name) => (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{name}:</span>
                                      <span className="font-mono font-bold">
                                        {activePieChart === 'recordingCount'
                                          ? value.toLocaleString()
                                          : `${value} min`}
                                      </span>
                                    </div>
                                  )}
                                />
                              }
                            />
                            <Pie
                              data={pieChartData}
                              dataKey={activePieChart}
                              nameKey="name"
                              innerRadius={60}
                              strokeWidth={5}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-none">
                      <CardContent className="h-[350px] flex flex-col items-center justify-center text-muted-foreground">
                        <Video className="h-12 w-12 mb-3" />
                        <p>No member recording data available</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

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

export default function WorkspaceRecordingStatsPage() {
  return (
    <Suspense fallback={<WorkspaceRecordingStatsPageSkeleton />}>
      <WorkspaceRecordingStatsPageContent />
    </Suspense>
  );
}

function WorkspaceRecordingStatsPageSkeleton() {
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
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
