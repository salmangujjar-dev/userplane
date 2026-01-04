'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Upload, Play, Video, Calendar } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import {
  useAdminWorkspaceRecordingStats,
  useAdminWorkspaceMemberRecordingStats,
} from '@/hooks/use-admin-recording-api';
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
} from '@/lib/parsers';

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

  const stats = statsResult?.success ? statsResult.data : null;
  const memberStats = memberStatsResult?.success ? memberStatsResult.data : null;

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
          <div className="space-y-4">
            <div className="mb-6">
              {isLoadingStats ? (
                <>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{stats?.workspaceName ?? 'Workspace'}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recording statistics and metrics
                  </p>
                </>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
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
            </div>

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
                      {activeChart === 'recordingCount' ? 'recording count' : 'duration in minutes'}{' '}
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
                  <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
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
                      <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={4} />
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
        </main>
      </div>
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
