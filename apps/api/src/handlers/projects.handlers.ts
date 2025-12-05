/**
 * Project handlers - HTTP request handlers for project operations
 * Handles project listing, creation, and updates
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import type { GetProjectsResult, CreateProjectResult, ProjectItem } from '@/api/types';
import { z } from 'zod';

const createProjectSchema = z.object({
  projectTitle: z.string().optional().nullable(),
});

export function createProjectHandler(
  projectService: ProjectService,
  workspaceService: WorkspaceService
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to create a project',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to create a project',
          },
          403
        );
      }

      const body = await c.req.json();
      const { projectTitle } = createProjectSchema.parse(body);

      // Create project
      const project = await projectService.createProject({
        workspaceId,
        projectTitle: projectTitle || null,
      });

      if (!project) {
        return c.json(
          {
            error: 'Internal Server Error',
            message: 'Failed to create project',
          },
          500
        );
      }

      const result: CreateProjectResult = {
        workspaceId,
        project: {
          projectId: project.id,
          projectTitle: project.projectTitle,
          projectPath: project.projectPath,
          isDefault: project.isDefault,
          createdAt: project.createdAt,
        },
        message: 'Project created successfully',
      };

      return c.json(result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getProjectsHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to view projects',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to view projects',
          },
          403
        );
      }

      const projects = await projectService.getProjectsByWorkspace(workspaceId);

      const projectItems: ProjectItem[] = projects.map((project) => ({
        projectId: project.id,
        projectTitle: project.projectTitle,
        projectPath: project.projectPath,
        isDefault: project.isDefault,
        createdAt: project.createdAt,
      }));

      const result: GetProjectsResult = {
        workspaceId,
        projects: projectItems,
      };

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

const updateProjectSchema = z.object({
  isDefault: z.boolean().optional(),
  projectTitle: z.string().optional().nullable(),
});

export function updateProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update project',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to update project',
          },
          403
        );
      }

      if (!projectId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Project ID is required',
          },
          400
        );
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

      return c.json(
        {
          message: 'Project updated successfully',
          projectId,
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

// Keep the old function name for backward compatibility, but it just calls the new one
export const setDefaultProjectHandler = updateProjectHandler;

export function deleteProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to delete a project',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to delete a project',
          },
          403
        );
      }

      if (!projectId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Project ID is required',
          },
          400
        );
      }

      await projectService.deleteProject(projectId, workspaceId);

      return c.json(
        {
          message: 'Project deleted successfully',
          projectId,
        },
        200
      );
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

const replaceProjectSchema = z.object({
  projectTitle: z.string().nullable(),
  isDefault: z.boolean(),
});

export function replaceProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to replace project',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to replace project',
          },
          403
        );
      }

      if (!projectId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Project ID is required',
          },
          400
        );
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

      return c.json(
        {
          message: 'Project replaced successfully',
          projectId,
          project: {
            projectId: project.id,
            projectTitle: project.projectTitle,
            projectPath: project.projectPath,
            isDefault: project.isDefault,
            createdAt: project.createdAt,
          },
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}
