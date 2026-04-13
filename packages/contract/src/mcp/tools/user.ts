import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneGetProfile = {
  name: 'userplane_get_profile',
  title: 'Get current user profile',
  description:
    "Retrieve the authenticated user's Userplane profile including name, email, and aggregate usage stats (workspace count, recording count, link count).",
  inputSchema: {},
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const McpProfileSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  stats: z.object({
    workspaces: z.number().int().nonnegative(),
    recordings: z.number().int().nonnegative(),
    links: z.number().int().nonnegative(),
  }),
});

export type McpProfile = z.infer<typeof McpProfileSchema>;
