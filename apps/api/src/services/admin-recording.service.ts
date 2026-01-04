/**
 * AdminRecordingService - Business logic for admin recording statistics
 * Handles workspace recording stats retrieval
 */

import { ORPCError } from '@orpc/server';
import type {
  AdminRecordingRepository,
  GetWorkspaceRecordingStatsParams,
  GetWorkspaceMemberRecordingStatsParams,
} from '@/api/repositories/admin-recording.repository';

export interface AdminRecordingServiceDeps {
  adminRecordingRepo: AdminRecordingRepository;
}

export class AdminRecordingService {
  constructor(private deps: AdminRecordingServiceDeps) {}

  /**
   * Get recording statistics for a workspace
   */
  async getWorkspaceRecordingStats(params: GetWorkspaceRecordingStatsParams) {
    const stats = await this.deps.adminRecordingRepo.getWorkspaceRecordingStats(params);

    if (!stats) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    return stats;
  }

  /**
   * Get member recording statistics for a workspace
   */
  async getWorkspaceMemberRecordingStats(params: GetWorkspaceMemberRecordingStatsParams) {
    const stats = await this.deps.adminRecordingRepo.getWorkspaceMemberRecordingStats(params);

    if (!stats) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    return stats;
  }
}
