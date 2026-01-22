import { PLAN_NAME_VALUES, USER_SELECTABLE_PLAN_IDS } from '@workspace/pricing';
import { z } from 'zod';

import { URLSchema } from './common';

/**
 * Provisioner schemas
 */

/**
 * Create workspace request (detailed mode)
 * Discriminated union between manual workspace creation (url + plan) or invite token
 * Plan selection excludes admin-only plans (sandbox, free)
 */
export const CreateWorkspaceSchema = z.object({
  body: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('manual'),
      url: URLSchema,
      plan: z.enum(USER_SELECTABLE_PLAN_IDS),
    }),
    z.object({
      type: z.literal('invite'),
      inviteToken: z.string(),
    }),
  ]),
});

/**
 * Workspace create response
 * Discriminated union based on 'created' flag:
 * - created: false (token invalid or workspace exists, includes URL and plan details for manual flow fallback)
 * - created: true (workspace successfully created with required IDs)
 */
export const WorkspaceCreateDataSchema = z.discriminatedUnion('created', [
  z.object({
    created: z.literal(false),
    workspaceUrl: URLSchema.optional(),
    workspacePlan: z.enum(USER_SELECTABLE_PLAN_IDS).optional(),
    planName: z.enum(PLAN_NAME_VALUES).optional(),
    planCycle: z.enum(['monthly', 'annual']).optional(),
  }),
  z.object({
    created: z.literal(true),
    workspaceId: z.string(),
    workspaceName: z.string(),
  }),
]);
