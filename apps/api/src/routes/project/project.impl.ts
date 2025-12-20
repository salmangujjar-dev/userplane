/**
 * Project contract implementation using oRPC
 * Implements the project contract defined in @workspace/contract
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { ProjectService } from '@/api/services/project.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import { z } from 'zod';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { createPaginationMeta } from '@/api/types';

/**
 * GET /workspace/:workspaceId/projects
 * List projects with pagination
 */
export const getProjectsImpl = (projectService: ProjectService) => {
  return authorized.project.list.handler(async ({ input }) => {
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
      try {
        const project = await projectService.getById(input.params.projectId);

        // Validate project belongs to workspace
        if (project.workspaceId !== input.params.workspaceId) {
          throw new ValidationError('Project does not belong to this workspace');
        }

        return {
          message: 'Project retrieved successfully',
          data: {
            workspaceId: input.params.workspaceId,
            project,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        const project = await projectService.createProject({
          workspaceId: input.params.workspaceId,
          projectTitle: input.body.projectTitle ?? null,
        });

        if (!project) {
          throw new Error('Failed to create project');
        }

        return {
          message: 'Project created successfully',
          data: {
            workspaceId: input.params.workspaceId,
            project,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        const project = await projectService.updateProject(input.params.projectId, {
          projectTitle: input.body.projectTitle,
        });

        if (!project) {
          throw new Error('Failed to update project');
        }

        return {
          message: 'Project updated successfully',
          data: {
            workspaceId: input.params.workspaceId,
            project,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        const project = await projectService.updateProject(input.params.projectId, {
          projectTitle: input.body.projectTitle,
        });

        if (!project) {
          throw new Error('Failed to replace project');
        }

        return {
          message: 'Project replaced successfully',
          data: {
            workspaceId: input.params.workspaceId,
            project,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        await projectService.deleteProject(input.params.projectId, input.params.workspaceId);

        return {
          message: 'Project deleted successfully',
          data: {
            workspaceId: input.params.workspaceId,
            projectId: input.params.projectId,
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
