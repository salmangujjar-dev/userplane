import { z } from 'zod';

import { PROJECT_PAGINATION } from '../constants';
import {
  PaginationMetaSchema,
  ProjectIdSchema,
  SortDirectionSchema,
  WorkspaceIdSchema,
} from './common';

/**
 * Project schemas
 */

// ============================================================================
// PROJECT-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for project title validation
 * Trims whitespace and validates the trimmed value
 */
export const ProjectTitleSchema = z
  .string()
  .trim()
  .min(1, 'Project title is required')
  .min(2, 'Project title must be at least 2 characters')
  .max(200, 'Project title must be less than 200 characters');

// ============================================================================
// PROJECT DATA SCHEMAS
// ============================================================================

/**
 * Project item
 */
export const ProjectItemSchema = z.object({
  projectId: ProjectIdSchema,
  projectTitle: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Create project request (detailed mode)
 */
export const CreateProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema.nullable().optional(),
  }),
});

/**
 * Project create response
 */
export const ProjectDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  project: ProjectItemSchema,
});

/**
 * Project sort fields
 */
export const ProjectSortFieldSchema = z.enum(['created_at', 'project_title']);

/**
 * Projects list query parameters (detailed mode)
 */
export const ListProjectsQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(PROJECT_PAGINATION.MIN_PER_PAGE)
      .max(PROJECT_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(PROJECT_PAGINATION.DEFAULT_PER_PAGE),
    sort_by: ProjectSortFieldSchema.optional().default('created_at'),
    sort_direction: SortDirectionSchema.optional().default('desc'),
  }),
});

/**
 * Projects list response
 */
export const ProjectsListDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  projects: z.array(ProjectItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Update project request (detailed mode)
 */
export const UpdateProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema.nullable().optional(),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * Project update response
 */
export const ProjectUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  project: ProjectItemSchema,
});

/**
 * Replace project request (detailed mode)
 */
export const ReplaceProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema.nullable(),
    isDefault: z.boolean(),
  }),
});

/**
 * Get project by ID request (detailed mode)
 */
export const ProjectByIdSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Project by ID response
 */
export const ProjectByIdDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  project: ProjectItemSchema,
});

/**
 * Delete project request (detailed mode)
 */
export const DeleteProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Project delete response
 */
export const ProjectDeleteDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  projectId: ProjectIdSchema,
});

/**
 * Restore project request (detailed mode)
 */
export const RestoreProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Project restore response
 */
export const ProjectRestoreDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  project: ProjectItemSchema,
});
