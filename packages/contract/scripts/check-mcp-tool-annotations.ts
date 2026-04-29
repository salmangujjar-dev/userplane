import { mcpToolDefinitions } from '../src/mcp';

const REQUIRED_HINTS = [
  'readOnlyHint',
  'destructiveHint',
  'idempotentHint',
  'openWorldHint',
] as const;

const EXPECTED_TOOL_NAMES = [
  'userplane_get_profile',
  'userplane_list_workspaces',
  'userplane_get_workspace',
  'userplane_list_projects',
  'userplane_get_project',
  'userplane_list_domains',
  'userplane_get_domain',
  'userplane_list_recordings',
  'userplane_get_rec_info',
  'userplane_get_rec_video',
  'userplane_get_rec_thumb',
  'userplane_get_rec_console',
  'userplane_get_rec_network',
  'userplane_get_rec_actions',
  'userplane_list_links',
  'userplane_create_link',
  'userplane_get_link',
  'userplane_update_link',
  'userplane_show_recording',
  'userplane_app_fetch_resource',
  'userplane_show_rec_console',
  'userplane_show_rec_network',
  'userplane_show_rec_actions',
] as const;

const errors: string[] = [];
const actualNames = mcpToolDefinitions.map((tool) => tool.name);
const actualNameSet = new Set(actualNames);
const expectedNameSet = new Set<string>(EXPECTED_TOOL_NAMES);

for (const name of EXPECTED_TOOL_NAMES) {
  if (!actualNameSet.has(name)) {
    errors.push(`Missing MCP tool definition: ${name}`);
  }
}

for (const name of actualNames) {
  if (!expectedNameSet.has(name)) {
    errors.push(`Unexpected MCP tool definition: ${name}`);
  }
}

for (const name of actualNames) {
  if (actualNames.filter((candidate) => candidate === name).length > 1) {
    errors.push(`Duplicate MCP tool definition: ${name}`);
  }
}

for (const tool of mcpToolDefinitions) {
  for (const hint of REQUIRED_HINTS) {
    if (typeof tool.annotations[hint] !== 'boolean') {
      errors.push(`${tool.name} must set annotations.${hint} to true or false`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${mcpToolDefinitions.length} MCP tool definitions; all hints are explicit.`);
