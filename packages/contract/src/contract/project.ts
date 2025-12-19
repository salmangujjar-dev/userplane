import { oc } from '@orpc/contract';
import {
  ListProjectsQuerySchema,
  ProjectsListDataSchema,
  CreateProjectSchema,
  ProjectDataSchema,
  UpdateProjectSchema,
  ProjectUpdateDataSchema,
  ReplaceProjectSchema,
  DeleteProjectSchema,
  ProjectDeleteDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Project contract
 * Endpoints for project operations
 */

/**
 * GET /workspace/:workspaceId/projects
 * List projects with pagination
 */
export const getProjects = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/projects',
    summary: 'List projects',
    description: 'Retrieve paginated list of projects',
    tags: ['Projects'],
    inputStructure: 'detailed',
  })
  .input(ListProjectsQuerySchema)
  .output(ApiResponseSchema(ProjectsListDataSchema));

/**
 * POST /workspace/:workspaceId/projects
 * Create a new project
 */
export const createProject = oc
  .route({
    method: 'POST',
    path: '/workspace/:workspaceId/projects',
    summary: 'Create project',
    description: 'Create a new project in the workspace',
    tags: ['Projects'],
    inputStructure: 'detailed',
  })
  .input(CreateProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * PATCH /workspace/:workspaceId/projects/:projectId
 * Update a project
 */
export const updateProject = oc
  .route({
    method: 'PATCH',
    path: '/workspace/:workspaceId/projects/:projectId',
    summary: 'Update project',
    description: 'Partially update project properties',
    tags: ['Projects'],
    inputStructure: 'detailed',
  })
  .input(UpdateProjectSchema)
  .output(ApiResponseSchema(ProjectUpdateDataSchema));

/**
 * PUT /workspace/:workspaceId/projects/:projectId
 * Replace project
 */
export const replaceProject = oc
  .route({
    method: 'PUT',
    path: '/workspace/:workspaceId/projects/:projectId',
    summary: 'Replace project',
    description: 'Replace all project properties',
    tags: ['Projects'],
    inputStructure: 'detailed',
  })
  .input(ReplaceProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * DELETE /workspace/:workspaceId/projects/:projectId
 * Delete a project
 */
export const deleteProject = oc
  .route({
    method: 'DELETE',
    path: '/workspace/:workspaceId/projects/:projectId',
    summary: 'Delete project',
    description: 'Soft delete a project',
    tags: ['Projects'],
    inputStructure: 'detailed',
  })
  .input(DeleteProjectSchema)
  .output(ApiResponseSchema(ProjectDeleteDataSchema));
