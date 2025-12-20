import { oc } from '@orpc/contract';
import {
  ListProjectsQuerySchema,
  ProjectsListDataSchema,
  CreateProjectSchema,
  ProjectDataSchema,
  ProjectByIdSchema,
  ProjectByIdDataSchema,
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
 * All endpoints require cookie-based authentication (userplane.session_token)
 */

/**
 * GET /workspace/{workspaceId}/projects
 * List projects with pagination
 */
export const getProjects = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/projects',
    inputStructure: 'detailed',
    summary: 'List projects',
    description: 'Retrieve paginated list of projects',
    tags: ['Projects'],
  })
  .input(ListProjectsQuerySchema)
  .output(ApiResponseSchema(ProjectsListDataSchema));

/**
 * POST /workspace/{workspaceId}/projects
 * Create a new project
 */
export const createProject = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/projects',
    inputStructure: 'detailed',
    summary: 'Create project',
    description: 'Create a new project in the workspace',
    tags: ['Projects'],
  })
  .input(CreateProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * GET /workspace/{workspaceId}/projects/{projectId}
 * Get project by ID
 */
export const getProjectById = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/projects/{projectId}',
    inputStructure: 'detailed',
    summary: 'Get project by ID',
    description: 'Retrieve complete project details',
    tags: ['Projects'],
  })
  .input(ProjectByIdSchema)
  .output(ApiResponseSchema(ProjectByIdDataSchema));

/**
 * PATCH /workspace/{workspaceId}/projects/{projectId}
 * Update a project
 */
export const updateProject = oc
  .route({
    method: 'PATCH',
    path: '/workspace/{workspaceId}/projects/{projectId}',
    inputStructure: 'detailed',
    summary: 'Update project',
    description: 'Partially update project properties',
    tags: ['Projects'],
  })
  .input(UpdateProjectSchema)
  .output(ApiResponseSchema(ProjectUpdateDataSchema));

/**
 * PUT /workspace/{workspaceId}/projects/{projectId}
 * Replace project
 */
export const replaceProject = oc
  .route({
    method: 'PUT',
    path: '/workspace/{workspaceId}/projects/{projectId}',
    inputStructure: 'detailed',
    summary: 'Replace project',
    description: 'Replace all project properties',
    tags: ['Projects'],
  })
  .input(ReplaceProjectSchema)
  .output(ApiResponseSchema(ProjectDataSchema));

/**
 * DELETE /workspace/{workspaceId}/projects/{projectId}
 * Delete a project
 */
export const deleteProject = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}/projects/{projectId}',
    inputStructure: 'detailed',
    summary: 'Delete project',
    description: 'Soft delete a project',
    tags: ['Projects'],
  })
  .input(DeleteProjectSchema)
  .output(ApiResponseSchema(ProjectDeleteDataSchema));
