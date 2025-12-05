/**
 * Project API Data Types
 * Data types for project-related API responses
 */

import type { PaginationMeta } from './common';
import type { ProjectItem } from './project.service';

export interface ProjectsListData {
  workspaceId: string;
  projects: ProjectItem[];
  pagination: PaginationMeta;
}

export interface ProjectData {
  workspaceId: string;
  project: ProjectItem;
}

export interface ProjectUpdateData {
  projectId: string;
}

export interface ProjectDeleteData {
  projectId: string;
}
