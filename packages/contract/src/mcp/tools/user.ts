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
