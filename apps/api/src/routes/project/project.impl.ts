/**
 * Project contract implementation using oRPC
 * Implements the project contract defined in @workspace/contract
 */

import { authorized } from '@/api/middleware/auth.orpc';
import {
  createWorkspaceMiddleware,
  createWorkspaceRoleMiddleware,
} from '@/api/middleware/workspace.orpc';
import type { ProjectService } from '@/api/services/project.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import { createPaginationMeta } from '@/api/types';
import { projectError } from '@workspace/contract';

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
      const project = await projectService.updateProject(input.params.projectId, {
        projectTitle: input.body.projectTitle,
      });

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
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.project.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await projectService.deleteProject(input.params.projectId, input.params.workspaceId);

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
 * POST /workspace/:workspaceId/projects/:projectId/restore
 * Restore a soft-deleted project
 * Requires admin or owner role
 */
export const restoreProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.project.restore
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const restoredProject = await projectService.restoreProject(input.params.projectId);

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
  workspaceService: WorkspaceService
) => {
  return {
    list: getProjectsImpl(projectService, workspaceMemberService, workspaceService),
    create: createProjectImpl(projectService, workspaceMemberService, workspaceService),
    getById: getProjectByIdImpl(projectService, workspaceMemberService, workspaceService),
    update: updateProjectImpl(projectService, workspaceMemberService, workspaceService),
    replace: replaceProjectImpl(projectService, workspaceMemberService, workspaceService),
    delete: deleteProjectImpl(projectService, workspaceMemberService, workspaceService),
    restore: restoreProjectImpl(projectService, workspaceMemberService, workspaceService),
  };
};
