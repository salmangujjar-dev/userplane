/**
 * Project handlers - HTTP request handlers for project operations
 * Handles project listing, deletion, and default assignment
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceService } from '@/api/services/workspace.service';
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
      const workspaceSlug = c.req.param('workspaceSlug');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to create a project',
          },
          401
        );
      }

      if (!workspaceId || !workspaceSlug) {
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

      return c.json(
        {
          message: 'Project created successfully',
          project,
        },
        201
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

      return c.json({ projects }, 200);
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

export function setDefaultProjectHandler(projectService: ProjectService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const projectId = c.req.param('projectId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to set default project',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to set default project',
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

      await projectService.setDefaultProject(projectId);

      return c.json(
        {
          message: 'Default project set successfully',
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
