/**
 * Project service types
 * Types for project creation and management operations
 */

import type { PaginationMeta } from './common';

/**
 * Parameters for creating a project
 */
export interface CreateProjectParams {
  workspaceId: string;
  projectTitle: string | null;
  isDefault?: boolean;
}

/**
 * Project item details
 */
export interface ProjectItem {
  projectId: string;
  projectTitle: string | null;
  projectPath: string;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Result containing workspace projects
 */
export interface GetProjectsResult {
  workspaceId: string;
  projects: ProjectItem[];
  pagination?: PaginationMeta;
}

/**
 * Request body for creating a project
 */
export interface CreateProjectRequest {
  projectTitle?: string | null;
}

/**
 * Result after creating a project
 */
export interface CreateProjectResult {
  workspaceId: string;
  project: ProjectItem;
  message: string;
}
