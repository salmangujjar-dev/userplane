/**
 * Project handlers - HTTP request handlers for project operations
 * Handles project listing, creation, and updates
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import type {
  ApiResponse,
  ApiErrorResponse,
  ProjectItem,
  ProjectsListData,
  ProjectData,
  ProjectUpdateData,
  ProjectDeleteData,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { z } from 'zod';
import { getErrorStatusCode } from '@/api/lib/errors';
import { createProjectSchema, updateProjectSchema, replaceProjectSchema } from '@/api/schema';

export function createProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to create a project',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to create a project',
        };
        return c.json(response, 403);
      }

      const body = await c.req.json();
      const { projectTitle } = createProjectSchema.parse(body);

      // Create project
      const project = await projectService.createProject({
        workspaceId,
        projectTitle: projectTitle || null,
      });

      if (!project) {
        const response: ApiErrorResponse = {
          error: 'Internal Server Error',
          message: 'Failed to create project',
        };
        return c.json(response, 500);
      }

      const response: ApiResponse<ProjectData> = {
        message: 'Project created successfully',
        data: {
          workspaceId,
          project: {
            projectId: project.id,
            projectTitle: project.projectTitle,
            isDefault: project.isDefault,
            createdAt: project.createdAt,
          },
        },
      };
      return c.json(response, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getProjectsHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to view projects',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to view projects',
        };
        return c.json(response, 403);
      }

      // Parse pagination query params
      const pageParam = c.req.query('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const perPage = 5;

      const { projects, total } = await projectService.getProjectsByWorkspacePaginated(
        workspaceId,
        page,
        perPage
      );

      const projectItems: ProjectItem[] = projects.map((project) => ({
        projectId: project.id,
        projectTitle: project.projectTitle,
        isDefault: project.isDefault,
        createdAt: project.createdAt,
      }));

      const response: ApiResponse<ProjectsListData> = {
        message: 'Projects retrieved successfully',
        data: {
          workspaceId,
          projects: projectItems,
          pagination: createPaginationMeta(page, perPage, total),
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update project',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update project',
        };
        return c.json(response, 403);
      }

      if (!projectId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Project ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const updates = updateProjectSchema.parse(body);

      // Handle setting default project
      if (updates.isDefault === true) {
        await projectService.setDefaultProject(projectId);
      }

      // Handle updating project title if provided
      if (updates.projectTitle !== undefined) {
        await projectService.updateProject(projectId, { projectTitle: updates.projectTitle });
      }

      const response: ApiResponse<ProjectUpdateData> = {
        message: 'Project updated successfully',
        data: { projectId },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

// Keep the old function name for backward compatibility, but it just calls the new one

export function deleteProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete a project',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to delete a project',
        };
        return c.json(response, 403);
      }

      if (!projectId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Project ID is required',
        };
        return c.json(response, 400);
      }

      await projectService.deleteProject(projectId, workspaceId);

      const response: ApiResponse<ProjectDeleteData> = {
        message: 'Project deleted successfully',
        data: { projectId },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function replaceProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to replace project',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to replace project',
        };
        return c.json(response, 403);
      }

      if (!projectId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Project ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const data = replaceProjectSchema.parse(body);

      // Handle setting default project
      if (data.isDefault === true) {
        await projectService.setDefaultProject(projectId);
      }

      // Handle updating project title
      await projectService.updateProject(projectId, { projectTitle: data.projectTitle });

      // Get updated project to return
      const project = await projectService.getById(projectId);

      const response: ApiResponse<ProjectData> = {
        message: 'Project replaced successfully',
        data: {
          workspaceId: workspaceId,
          project: {
            projectId: project.id,
            projectTitle: project.projectTitle,
            isDefault: project.isDefault,
            createdAt: project.createdAt,
          },
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}
