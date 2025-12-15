/**
 * SweepRepository - Data access layer for orphaned deletion queries
 * Specialized repository for the sweep job that finds orphaned entities
 */

import { eq, and, lt, exists } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { workspaces, projects, links, recordings } from '@workspace/db';

export class SweepRepository {
  constructor(private db: DbClient) {}

  /**
   * Find workspaces that are soft-deleted and still have recordings to cleanup
   * Used by sweep job to catch orphaned workspace deletions
   */
  async findOrphanedWorkspaces(cutoffDate: Date) {
    const results = await this.db
      .select({
        id: workspaces.id,
      })
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isDeleted, true),
          lt(workspaces.deletedAt, cutoffDate),
          exists(
            this.db
              .select({ id: recordings.id })
              .from(recordings)
              .where(
                and(
                  eq(recordings.workspaceId, workspaces.id),
                  eq(recordings.uploadStatus, 'pending')
                )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.workspaceId, workspaces.id),
                      eq(recordings.uploadStatus, 'partial')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.workspaceId, workspaces.id),
                      eq(recordings.uploadStatus, 'available')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.workspaceId, workspaces.id),
                      eq(recordings.uploadStatus, 'failed')
                    )
                  )
              )
          )
        )
      );

    return results;
  }

  /**
   * Find projects that are soft-deleted and still have recordings to cleanup
   * Used by sweep job to catch orphaned project deletions
   */
  async findOrphanedProjects(cutoffDate: Date) {
    const results = await this.db
      .select({
        id: projects.id,
      })
      .from(projects)
      .where(
        and(
          eq(projects.isDeleted, true),
          lt(projects.deletedAt, cutoffDate),
          exists(
            this.db
              .select({ id: recordings.id })
              .from(recordings)
              .where(
                and(eq(recordings.projectId, projects.id), eq(recordings.uploadStatus, 'pending'))
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.projectId, projects.id),
                      eq(recordings.uploadStatus, 'partial')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.projectId, projects.id),
                      eq(recordings.uploadStatus, 'available')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.projectId, projects.id),
                      eq(recordings.uploadStatus, 'failed')
                    )
                  )
              )
          )
        )
      );

    return results;
  }

  /**
   * Find links that are soft-deleted and still have recordings to cleanup
   * Used by sweep job to catch orphaned link deletions
   */
  async findOrphanedLinks(cutoffDate: Date) {
    const results = await this.db
      .select({
        id: links.id,
      })
      .from(links)
      .where(
        and(
          eq(links.isDeleted, true),
          lt(links.deletedAt, cutoffDate),
          exists(
            this.db
              .select({ id: recordings.id })
              .from(recordings)
              .where(
                and(
                  eq(recordings.recordingLinkId, links.id),
                  eq(recordings.uploadStatus, 'pending')
                )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.recordingLinkId, links.id),
                      eq(recordings.uploadStatus, 'partial')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.recordingLinkId, links.id),
                      eq(recordings.uploadStatus, 'available')
                    )
                  )
              )
              .union(
                this.db
                  .select({ id: recordings.id })
                  .from(recordings)
                  .where(
                    and(
                      eq(recordings.recordingLinkId, links.id),
                      eq(recordings.uploadStatus, 'failed')
                    )
                  )
              )
          )
        )
      );

    return results;
  }
}
