import { oc } from '@orpc/contract';
import {
  ListProjectsQuerySchema,
  ProjectsListDataSchema,
  CreateProjectSchema,
  ProjectDataSchema,
  UpdateProjectSchema,
  ProjectUpdateDataSchema,
  ReplaceProjectSchema,
  ProjectDeleteDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Project contract
 * Endpoints for project operations
 */

/**
 * GET /api/v1/workspace/:workspaceId/projects
 * List projects with pagination
 */
export const getProjects = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/projects',
    summary: 'List projects',
    description: 'Retrieve paginated list of projects',
    tags: ['Projects'],
  })
  .input(ListProjectsQuerySchema)
  .output(ApiResponseSchema(ProjectsListDataSchema));

/**
 * POST /api/v1/workspace/:workspaceId/projects
 * Create a new project
 */
export const createProject = oc
  .route({
    method: 'POST',
    path: '/api/v1/workspace/:workspaceId/projects',
    summary: 'Create project',
    description: 'Create a new project in the workspace',
    tags: ['Projects'],
  })
  .input(CreateProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * PATCH /api/v1/workspace/:workspaceId/projects/:projectId
 * Update a project
 */
export const updateProject = oc
  .route({
    method: 'PATCH',
    path: '/api/v1/workspace/:workspaceId/projects/:projectId',
    summary: 'Update project',
    description: 'Partially update project properties',
    tags: ['Projects'],
  })
  .input(UpdateProjectSchema)
  .output(ApiResponseSchema(ProjectUpdateDataSchema));

/**
 * PUT /api/v1/workspace/:workspaceId/projects/:projectId
 * Replace project
 */
export const replaceProject = oc
  .route({
    method: 'PUT',
    path: '/api/v1/workspace/:workspaceId/projects/:projectId',
    summary: 'Replace project',
    description: 'Replace all project properties',
    tags: ['Projects'],
  })
  .input(ReplaceProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * DELETE /api/v1/workspace/:workspaceId/projects/:projectId
 * Delete a project
 */
export const deleteProject = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:workspaceId/projects/:projectId',
    summary: 'Delete project',
    description: 'Soft delete a project',
    tags: ['Projects'],
  })
  .output(ApiResponseSchema(ProjectDeleteDataSchema));
