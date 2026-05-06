import { fileURLToPath } from 'node:url';

import { mcpToolDefinitions } from '../src/mcp';

/**
 * Generates the ChatGPT Apps submission artifact.
 * Output: apps/docs/chatgpt-app-submission.json
 *
 * Usage: bun run scripts/generate-mcp-tool-hint-justifications.ts
 */

type ToolName = (typeof mcpToolDefinitions)[number]['name'];

interface ToolJustifications {
  read_only_justification: string;
  open_world_justification: string;
  destructive_justification: string;
}

const TOOL_HINT_JUSTIFICATIONS = {
  userplane_get_profile: {
    read_only_justification:
      "Retrieves the authenticated user's profile and aggregate usage stats without creating, updating, or deleting data.",
    open_world_justification:
      'Reads private Userplane account data and cannot post, send, publish, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_list_workspaces: {
    read_only_justification:
      'Lists workspaces the authenticated user belongs to without changing any workspace or membership records.',
    open_world_justification:
      'Reads private Userplane workspace data and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_workspace: {
    read_only_justification:
      'Retrieves metadata for one workspace without creating, updating, or deleting records.',
    open_world_justification:
      'Reads private Userplane workspace data and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_list_projects: {
    read_only_justification:
      'Lists project metadata for a workspace without modifying projects or retention settings.',
    open_world_justification:
      'Reads private Userplane project data and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_project: {
    read_only_justification:
      'Retrieves one project and its retention metadata without modifying project state.',
    open_world_justification:
      'Reads private Userplane project data and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_list_domains: {
    read_only_justification:
      'Lists registered workspace domains and their verification statuses without changing domain records.',
    open_world_justification:
      'Reads private Userplane domain records and cannot publish domains or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_domain: {
    read_only_justification:
      'Retrieves one domain record and verification status without modifying domain configuration.',
    open_world_justification:
      'Reads private Userplane domain data and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_list_recordings: {
    read_only_justification:
      'Lists recording metadata for a workspace without creating, updating, or deleting recordings.',
    open_world_justification:
      'Reads private Userplane recording records and cannot publish content or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_info: {
    read_only_justification:
      'Retrieves detailed metadata for one recording without changing recording, link, or project state.',
    open_world_justification:
      'Reads private Userplane recording data and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_video: {
    read_only_justification:
      'Returns a time-limited URL for an existing recording video without modifying the video or recording record.',
    open_world_justification:
      'May return a time-limited Userplane storage URL, but cannot post, publish, send, or change public internet state.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_thumb: {
    read_only_justification:
      'Returns a time-limited URL for an existing recording thumbnail without modifying the image or recording record.',
    open_world_justification:
      'May return a time-limited Userplane storage URL, but cannot post, publish, send, or change public internet state.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_console: {
    read_only_justification:
      'Fetches captured console log entries for an existing recording without modifying stored logs or recording data.',
    open_world_justification:
      'Reads from Userplane-controlled storage and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_network: {
    read_only_justification:
      'Fetches captured network log entries for an existing recording without modifying stored logs or recording data.',
    open_world_justification:
      'Reads from Userplane-controlled storage and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_get_rec_actions: {
    read_only_justification:
      'Fetches captured user action events for an existing recording without modifying stored actions or recording data.',
    open_world_justification:
      'Reads from Userplane-controlled storage and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_list_links: {
    read_only_justification:
      'Lists recording link metadata for a workspace without creating, updating, or deleting links.',
    open_world_justification:
      'Reads private Userplane link records and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_create_link: {
    read_only_justification:
      'Creates a new private recording link record, so it changes Userplane workspace state.',
    open_world_justification:
      'Creates a first-party Userplane recording URL that can be opened by an end user outside the dashboard; workspace membership is required and the tool does not send messages or post to third-party services.',
    destructive_justification:
      'Adds a new link record and consumes link quota, but does not delete, overwrite, revoke access, send messages, or perform an irreversible action.',
  },
  userplane_get_link: {
    read_only_justification:
      'Retrieves one recording link and its metadata without modifying the link record.',
    open_world_justification:
      'Reads private Userplane link data and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_update_link: {
    read_only_justification:
      'Updates an existing private recording link record, so it changes Userplane workspace state.',
    open_world_justification:
      'Changes settings on a first-party Userplane recording URL that can be opened by an end user outside the dashboard; workspace membership is required and only provided fields are updated.',
    destructive_justification:
      'Can overwrite existing link settings such as title, reusability, provider fields, or metadata, with no MCP undo path.',
  },
  userplane_show_recording: {
    read_only_justification:
      'Retrieves recording metadata and related resource references for display without modifying any records.',
    open_world_justification:
      'Reads Userplane data and storage references for a private viewer and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_app_fetch_resource: {
    read_only_justification:
      'Fetches existing recording log content for the app UI without modifying stored logs or recording data.',
    open_world_justification:
      'Reads from Userplane-controlled storage on behalf of the app UI and cannot change public internet state or third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_show_rec_console: {
    read_only_justification:
      'Retrieves recording metadata for the console log viewer without modifying any records.',
    open_world_justification:
      'Reads private Userplane recording data and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_show_rec_network: {
    read_only_justification:
      'Retrieves recording metadata for the network request viewer without modifying any records.',
    open_world_justification:
      'Reads private Userplane recording data and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
  userplane_show_rec_actions: {
    read_only_justification:
      'Retrieves recording metadata for the user action viewer without modifying any records.',
    open_world_justification:
      'Reads private Userplane recording data and cannot post, publish, send, or update third-party systems.',
    destructive_justification:
      'Does not delete, overwrite, revoke access, or perform any irreversible action.',
  },
} satisfies Record<ToolName, ToolJustifications>;

const output = {
  $schema: 'https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json',
  schema_version: 1,
  tools: Object.fromEntries(
    mcpToolDefinitions.map((tool) => {
      const justifications = TOOL_HINT_JUSTIFICATIONS[tool.name];
      if (!justifications) {
        throw new Error(`Missing tool hint justifications for ${tool.name}`);
      }

      return [
        tool.name,
        {
          annotations: {
            readOnlyHint: tool.annotations.readOnlyHint,
            openWorldHint: tool.annotations.openWorldHint,
            destructiveHint: tool.annotations.destructiveHint,
          },
          justifications,
        },
      ];
    })
  ),
};

const outputPath = fileURLToPath(
  new URL('../../../apps/docs/chatgpt-app-submission.json', import.meta.url)
);
await Bun.write(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Wrote ${mcpToolDefinitions.length} tool submission entries to ${outputPath}`);
