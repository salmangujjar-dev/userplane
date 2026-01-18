/**
 * Project contract implementation using oRPC
 * Implements the project contract defined in @workspace/contract
 */

import { projectError } from '@workspace/contract';

import { env } from '@/api/env';
import { authorized } from '@/api/middleware/auth.orpc';
import {
  createWorkspaceMiddleware,
  createWorkspaceRestoreMiddleware,
  createWorkspaceRoleMiddleware,
} from '@/api/middleware/workspace.orpc';
import type { EmailService } from '@/api/services/email.service';
import type { ProjectService } from '@/api/services/project.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { createPaginationMeta } from '@/api/types';

/**
 * GET /workspace/:workspaceId/projects
 * List projects with pagination and sorting
 * Requires workspace member
 */
export const getProjectsImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.list
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const page = input.query.page || 1;
      const perPage = input.query.per_page || 5;
      const sortBy = input.query.sort_by || 'created_at';
      const sortDirection = input.query.sort_direction || 'desc';

      const { projects, total } = await projectService.getProjectsByWorkspacePaginated(
        input.params.workspaceId,
        page,
        perPage,
        sortBy,
        sortDirection
      );

      return {
        message: 'Projects retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          projects,
          pagination: createPaginationMeta(page, perPage, total),
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/projects/:projectId
 * Get project by ID
 */
export const getProjectByIdImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.getById
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const project = await projectService.getById(input.params.projectId);

      // Validate project belongs to workspace
      if (project.workspaceId !== input.params.workspaceId) {
        throw projectError.PROJECT_WORKSPACE_MISMATCH();
      }

      return {
        message: 'Project retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project,
        },
      };
    });
};

/**
 * POST /workspace/:workspaceId/projects
 * Create a new project
 */
export const createProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.create
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const project = await projectService.createProject({
        workspaceId: input.params.workspaceId,
        projectTitle: input.body.projectTitle ?? null,
      });

      if (!project) {
        throw projectError.PROJECT_CREATE_FAILED();
      }

      return {
        message: 'Project created successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project,
        },
      };
    });
};

/**
 * PATCH /workspace/:workspaceId/projects/:projectId
 * Update a project
 */
export const updateProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const updates: Partial<{ projectTitle: string; isDefault: boolean }> = {};

      if (input.body.projectTitle !== undefined) {
        updates.projectTitle = input.body.projectTitle || 'Untitled Project';
      }
      if (input.body.isDefault !== undefined) {
        updates.isDefault = input.body.isDefault;
      }

      const project = await projectService.updateProject(input.params.projectId, updates);

      if (!project) {
        throw projectError.PROJECT_UPDATE_FAILED();
      }

      return {
        message: 'Project updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project,
        },
      };
    });
};

/**
 * PUT /workspace/:workspaceId/projects/:projectId
 * Replace project
 */
export const replaceProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.replace
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const project = await projectService.updateProject(input.params.projectId, {
        projectTitle: input.body.projectTitle,
        isDefault: input.body.isDefault,
      });

      if (!project) {
        throw projectError.PROJECT_UPDATE_FAILED();
      }

      return {
        message: 'Project replaced successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project,
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId/projects/:projectId
 * Delete a project
 * Requires admin or owner role
 */
export const deleteProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.project.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const project = await projectService.getById(input.params.projectId);

      await projectService.deleteProject(input.params.projectId, input.params.workspaceId);

      // Calculate deletion date (30 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);
      const formattedDeletionDate = deletionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Construct cancel URL with both workspaceId and projectId
      const cancelUrl = `${env.invite.appUrl}/workspace/restore?type=project&workspaceId=${input.params.workspaceId}&projectId=${input.params.projectId}`;

      // Send deletion scheduled email
      await emailService.sendProjectDeletionScheduled({
        to: context.user.email,
        projectName: project.projectTitle || 'Untitled Project',
        deletionDate: formattedDeletionDate,
        cancelUrl,
      });

      return {
        message: 'Project deleted successfully',
        data: {
          workspaceId: input.params.workspaceId,
          projectId: input.params.projectId,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/projects/:projectId/restore
 * Get restore info for a soft-deleted project
 * Requires admin or owner role
 */
export const getProjectRestoreInfoImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceRestoreMiddleware = createWorkspaceRestoreMiddleware(workspaceMemberService, [
    'admin',
    'owner',
  ]);

  return authorized.project.getRestoreInfo
    .use(workspaceRestoreMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const result = await projectService.getProjectRestoreInfo(input.params.projectId);

      return {
        message: 'Project restore info retrieved successfully',
        data: {
          project: result,
        },
      };
    });
};

/**
 * POST /workspace/:workspaceId/projects/:projectId/restore
 * Restore a soft-deleted project
 * Requires admin or owner role
 */
export const restoreProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const workspaceRestoreMiddleware = createWorkspaceRestoreMiddleware(workspaceMemberService, [
    'admin',
    'owner',
  ]);

  return authorized.project.restore
    .use(workspaceRestoreMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const restoredProject = await projectService.restoreProject(input.params.projectId);

      // Calculate days since deletion
      let deletedSince: number | null = null;
      if (restoredProject.deletedAt) {
        const now = new Date();
        const deletedAt = new Date(restoredProject.deletedAt);
        deletedSince =
          Math.round(((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10;
      }

      // Send email to workspace owners that the project has been restored
      const owners = await workspaceMemberService.getOwners(input.params.workspaceId);
      const dashboardUrl = `${env.invite.appUrl}/workspace/${input.params.workspaceId}`;

      await Promise.allSettled(
        owners.map((owner) =>
          emailService.sendProjectRecoveryConfirmation({
            to: owner.email,
            projectName: restoredProject.projectTitle || 'Project',
            dashboardUrl,
          })
        )
      );

      return {
        message: 'Project restored successfully',
        data: {
          workspaceId: input.params.workspaceId,
          project: {
            projectId: restoredProject.projectId,
            projectTitle: restoredProject.projectTitle,
            isDefault: restoredProject.isDefault,
            createdAt: restoredProject.createdAt,
            updatedAt: restoredProject.updatedAt,
            isDeleted: restoredProject.isDeleted,
            deletedAt: restoredProject.deletedAt,
            deletedSince,
          },
        },
      };
    });
};

/**
 * Create the project procedures object
 */
export const createProjectProcedures = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  return {
    list: getProjectsImpl(projectService, workspaceMemberService, workspaceService),
    create: createProjectImpl(projectService, workspaceMemberService, workspaceService),
    getById: getProjectByIdImpl(projectService, workspaceMemberService, workspaceService),
    update: updateProjectImpl(projectService, workspaceMemberService, workspaceService),
    replace: replaceProjectImpl(projectService, workspaceMemberService, workspaceService),
    delete: deleteProjectImpl(
      projectService,
      workspaceMemberService,
      workspaceService,
      emailService
    ),
    getRestoreInfo: getProjectRestoreInfoImpl(projectService, workspaceMemberService),
    restore: restoreProjectImpl(
      projectService,
      workspaceMemberService,
      workspaceService,
      emailService
    ),
  };
};
