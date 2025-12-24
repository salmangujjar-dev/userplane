/**
 * Project contract implementation using oRPC
 * Implements the project contract defined in @workspace/contract
 */

import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { ProjectService } from '@/api/services/project.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import { ORPCError } from '@orpc/server';
import { createPaginationMeta } from '@/api/types';

/**
 * GET /workspace/:workspaceId/projects
 * List projects with pagination
 */
export const getProjectsImpl = (projectService: ProjectService) => {
  return authorized.project.list.handler(async ({ input }) => {
    const page = input.query.page || 1;
    const perPage = input.query.per_page || 5;

    const { projects, total } = await projectService.getProjectsByWorkspacePaginated(
      input.params.workspaceId,
      page,
      perPage
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
        throw new ORPCError('BAD_REQUEST', {
          message: 'Project does not belong to this workspace',
        });
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
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create project' });
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
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update project' });
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
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to replace project' });
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
 */
export const deleteProjectImpl = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.project.delete
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
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
 * Create the project procedures object
 */
export const createProjectProcedures = (
  projectService: ProjectService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  return {
    list: getProjectsImpl(projectService),
    create: createProjectImpl(projectService, workspaceMemberService, workspaceService),
    getById: getProjectByIdImpl(projectService, workspaceMemberService, workspaceService),
    update: updateProjectImpl(projectService, workspaceMemberService, workspaceService),
    replace: replaceProjectImpl(projectService, workspaceMemberService, workspaceService),
    delete: deleteProjectImpl(projectService, workspaceMemberService, workspaceService),
  };
};
