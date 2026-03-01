/**
 * AdminRecordingRepository - Data access layer for admin recording statistics
 * Handles database queries for workspace recording stats
 */

import type { DbClient } from '@userplane/db';
import { and, count, eq, sql } from '@userplane/db';
import { recordings, user, workspaceMembers, workspaces } from '@userplane/db';

export interface AdminRecordingWeeklyStat {
  week: string;
  recordingCount: number;
  totalDuration: number;
}

export interface WorkspaceRecordingStats {
  workspaceId: string;
  workspaceName: string;
  totalRecordings: number;
  totalDuration: number;
  activeRecordings: number;
  deletedRecordings: number;
  weeklyStats: AdminRecordingWeeklyStat[];
}

export interface AdminMemberRecordingStat {
  memberId: string;
  memberName: string;
  recordingCount: number;
  totalDuration: number;
}

export interface WorkspaceMemberRecordingStats {
  workspaceId: string;
  workspaceName: string;
  memberStats: AdminMemberRecordingStat[];
}

export interface GetWorkspaceRecordingStatsParams {
  workspaceId: string;
  filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
  filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
  filterDeleted?: 'all' | 'active' | 'deleted';
  weeksToShow?: '12' | '24' | '36' | '48';
}

export interface GetWorkspaceMemberRecordingStatsParams {
  workspaceId: string;
  filterUploadStatus?: 'pending' | 'available' | 'expired' | 'purged';
  filterStreamingStatus?: 'pending' | 'available' | 'failed' | 'expired' | 'purged';
  filterDeleted?: 'all' | 'active' | 'deleted';
}

export class AdminRecordingRepository {
  constructor(private db: DbClient) {}

  /**
   * Get recording statistics for a workspace
   */
  async getWorkspaceRecordingStats(
    params: GetWorkspaceRecordingStatsParams
  ): Promise<WorkspaceRecordingStats | null> {
    const {
      workspaceId,
      filterUploadStatus,
      filterStreamingStatus,
      filterDeleted = 'all',
      weeksToShow = '12',
    } = params;

    // Get workspace info
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    if (!workspace) return null;

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [eq(recordings.workspaceId, workspaceId)];

    if (filterUploadStatus) {
      conditions.push(eq(recordings.uploadStatus, filterUploadStatus));
    }

    if (filterStreamingStatus) {
      conditions.push(eq(recordings.streamingStatus, filterStreamingStatus));
    }

    if (filterDeleted === 'active') {
      conditions.push(eq(recordings.isDeleted, false));
    } else if (filterDeleted === 'deleted') {
      conditions.push(eq(recordings.isDeleted, true));
    }

    const whereClause = and(...conditions);

    // Get total counts
    const [totals] = await this.db
      .select({
        totalRecordings: count().as('total_recordings'),
        totalDuration: sql<number>`COALESCE(SUM(${recordings.recordingDurationMs}), 0)`.as(
          'total_duration'
        ),
      })
      .from(recordings)
      .where(whereClause);

    // Get active/deleted counts (not affected by filterDeleted)
    const baseConditions: ReturnType<typeof eq>[] = [eq(recordings.workspaceId, workspaceId)];
    if (filterUploadStatus) {
      baseConditions.push(eq(recordings.uploadStatus, filterUploadStatus));
    }
    if (filterStreamingStatus) {
      baseConditions.push(eq(recordings.streamingStatus, filterStreamingStatus));
    }

    const [activeCounts] = await this.db
      .select({
        activeRecordings: count().as('active_recordings'),
      })
      .from(recordings)
      .where(and(...baseConditions, eq(recordings.isDeleted, false)));

    const [deletedCounts] = await this.db
      .select({
        deletedRecordings: count().as('deleted_recordings'),
      })
      .from(recordings)
      .where(and(...baseConditions, eq(recordings.isDeleted, true)));

    // Get weekly stats based on requested range
    // Generate all weeks to ensure consistent chart rendering with empty weeks
    const weeksCount = Number.parseInt(weeksToShow, 10);

    // Use SQL to generate all weeks and left join with actual data
    // This ensures we always get the requested number of weeks even if some have no recordings
    const weeklyResult = await this.db.execute<{
      week: string;
      recording_count: string;
      total_duration: string;
    }>(sql`
      WITH week_series AS (
        SELECT
          TO_CHAR(DATE_TRUNC('week', d), 'YYYY-MM-DD') as week_start
        FROM generate_series(
          DATE_TRUNC('week', CURRENT_DATE - INTERVAL '${sql.raw(`${weeksCount * 7}`)} days'),
          DATE_TRUNC('week', CURRENT_DATE),
          INTERVAL '1 week'
        ) AS d
      )
      SELECT
        ws.week_start as week,
        COALESCE(COUNT(r.recording_id), 0)::text as recording_count,
        COALESCE(SUM(r.recording_duration), 0)::text as total_duration
      FROM week_series ws
      LEFT JOIN recordings r ON
        TO_CHAR(DATE_TRUNC('week', r.created_at), 'YYYY-MM-DD') = ws.week_start
        AND r.workspace_id = ${workspaceId}
        ${filterUploadStatus ? sql`AND r.upload_status = ${filterUploadStatus}` : sql``}
        ${filterStreamingStatus ? sql`AND r.streaming_status = ${filterStreamingStatus}` : sql``}
        ${filterDeleted === 'active' ? sql`AND r.is_deleted = false` : filterDeleted === 'deleted' ? sql`AND r.is_deleted = true` : sql``}
      GROUP BY ws.week_start
      ORDER BY ws.week_start
    `);

    const allWeeklyStats: AdminRecordingWeeklyStat[] = weeklyResult.rows.map((r) => ({
      week: r.week,
      recordingCount: Number(r.recording_count),
      totalDuration: Number(r.total_duration),
    }));

    return {
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      totalRecordings: Number(totals?.totalRecordings ?? 0),
      totalDuration: Number(totals?.totalDuration ?? 0),
      activeRecordings: Number(activeCounts?.activeRecordings ?? 0),
      deletedRecordings: Number(deletedCounts?.deletedRecordings ?? 0),
      weeklyStats: allWeeklyStats,
    };
  }

  /**
   * Get member recording statistics for a workspace
   * Returns recording count and duration per member for pie chart
   */
  async getWorkspaceMemberRecordingStats(
    params: GetWorkspaceMemberRecordingStatsParams
  ): Promise<WorkspaceMemberRecordingStats | null> {
    const {
      workspaceId,
      filterUploadStatus,
      filterStreamingStatus,
      filterDeleted = 'all',
    } = params;

    // Get workspace info
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    if (!workspace) return null;

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [eq(recordings.workspaceId, workspaceId)];

    if (filterUploadStatus) {
      conditions.push(eq(recordings.uploadStatus, filterUploadStatus));
    }

    if (filterStreamingStatus) {
      conditions.push(eq(recordings.streamingStatus, filterStreamingStatus));
    }

    if (filterDeleted === 'active') {
      conditions.push(eq(recordings.isDeleted, false));
    } else if (filterDeleted === 'deleted') {
      conditions.push(eq(recordings.isDeleted, true));
    }

    // Get member recording stats
    const memberStats = await this.db
      .select({
        memberId: workspaceMembers.workspaceMemberId,
        memberName: user.name,
        recordingCount: count().as('recording_count'),
        totalDuration: sql<number>`COALESCE(SUM(${recordings.recordingDurationMs}), 0)`.as(
          'total_duration'
        ),
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(and(...conditions))
      .groupBy(workspaceMembers.workspaceMemberId, user.name)
      .orderBy(sql`COUNT(*) DESC`);

    return {
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      memberStats: memberStats.map((m) => ({
        memberId: m.memberId,
        memberName: m.memberName,
        recordingCount: Number(m.recordingCount),
        totalDuration: Number(m.totalDuration),
      })),
    };
  }
}
