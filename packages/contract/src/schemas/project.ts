import { z } from 'zod';

import { PROJECT_PAGINATION, RETENTION_DAYS_VALUES } from '../constants';
import type { RetentionDays } from '../constants/retention';
import {
  PaginationMetaSchema,
  ProjectIdSchema,
  RestorationStatusSchema,
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

/**
 * Schema for recording retention days validation
 * Only allows predefined values from RETENTION_DAYS_VALUES
 */
export const RetentionDaysSchema = z
  .number()
  .int()
  .refine((v): v is RetentionDays => (RETENTION_DAYS_VALUES as readonly number[]).includes(v), {
    message: `Must be one of: ${RETENTION_DAYS_VALUES.join(', ')}`,
  });

// ============================================================================
// PROJECT DATA SCHEMAS
// ============================================================================

/**
 * Project item
 */
export const ProjectItemSchema = z.object({
  projectId: ProjectIdSchema,
  projectTitle: z.string(),
  isDefault: z.boolean(),
  recordingRetentionDays: RetentionDaysSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create project request (detailed mode)
 * projectTitle is optional/nullable for backwards compatibility
 * If not provided or null, defaults to "Untitled Project"
 */
export const CreateProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema.nullable().optional(),
    recordingRetentionDays: RetentionDaysSchema.optional(),
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
 * projectTitle is optional/nullable for partial updates
 * If provided as null or empty, defaults to "Untitled Project"
 */
export const UpdateProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema.nullable().optional(),
    isDefault: z.boolean().optional(),
    recordingRetentionDays: RetentionDaysSchema.optional(),
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
 * Replace requires all fields to be provided
 */
export const ReplaceProjectSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
  body: z.object({
    projectTitle: ProjectTitleSchema,
    isDefault: z.boolean(),
    recordingRetentionDays: RetentionDaysSchema.optional(),
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
 * Get project restore info request (detailed mode)
 */
export const GetProjectRestoreInfoSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    projectId: ProjectIdSchema,
  }),
});

/**
 * Project restore info response
 */
export const ProjectRestoreInfoDataSchema = z.object({
  restoration: RestorationStatusSchema,
  reason: z.string().optional(),
  project: z.object({
    projectId: ProjectIdSchema,
    projectTitle: z.string(),
    workspaceId: WorkspaceIdSchema,
    isDeleted: z.boolean(),
    deletedAt: z.coerce.date().nullable(),
    deletedSince: z.number().nullable(),
  }),
  linksToRestore: z.number().int().nonnegative(),
  recordingsToRestore: z.number().int().nonnegative(),
});

/**
 * Type inference from ProjectRestoreInfoDataSchema
 */
export type ProjectRestoreInfoData = z.infer<typeof ProjectRestoreInfoDataSchema>;

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
  restorationStatus: RestorationStatusSchema,
  workspaceId: WorkspaceIdSchema,
  project: z.object({
    projectId: ProjectIdSchema,
    projectTitle: z.string(),
    isDefault: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    isDeleted: z.boolean(),
    deletedAt: z.coerce.date().nullable(),
    deletedSince: z.number().nullable(),
  }),
  restoredLinks: z.number().int().nonnegative(),
  restoredRecordings: z.number().int().nonnegative(),
});

/**
 * Type inference from ProjectRestoreDataSchema
 */
export type ProjectRestoreData = z.infer<typeof ProjectRestoreDataSchema>;

// Additional type exports
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type ProjectsListData = z.infer<typeof ProjectsListDataSchema>;
export type { RetentionDays };
