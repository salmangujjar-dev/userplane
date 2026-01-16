/**
 * AdminRecordingService - Business logic for admin recording statistics
 * Handles workspace recording stats retrieval
 */

import { adminError } from '@workspace/contract';
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
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return stats;
  }

  /**
   * Get member recording statistics for a workspace
   */
  async getWorkspaceMemberRecordingStats(params: GetWorkspaceMemberRecordingStatsParams) {
    const stats = await this.deps.adminRecordingRepo.getWorkspaceMemberRecordingStats(params);

    if (!stats) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return stats;
  }
}
