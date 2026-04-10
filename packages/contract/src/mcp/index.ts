export * from './tools';
export * from './types';

import {
  userplaneCreateLink,
  userplaneDeleteLink,
  userplaneGetLink,
  userplaneListLinks,
  userplaneUpdateLink,
} from './tools/links';
import { userplaneGetProject, userplaneListProjects } from './tools/projects';
import {
  userplaneGetRecActions,
  userplaneGetRecConsole,
  userplaneGetRecNetwork,
  userplaneGetRecThumb,
  userplaneGetRecVideo,
} from './tools/recording-resources';
import {
  userplaneDeleteRecording,
  userplaneGetRecording,
  userplaneListRecordings,
} from './tools/recordings';
import { userplaneShowRecording } from './tools/show-recording';
import { userplaneGetProfile } from './tools/user';
import { userplaneGetWorkspace, userplaneListWorkspaces } from './tools/workspaces';

/** All Userplane MCP tool definitions, in registration order. */
export const mcpToolDefinitions = [
  userplaneGetProfile,
  userplaneListWorkspaces,
  userplaneGetWorkspace,
  userplaneListProjects,
  userplaneGetProject,
  userplaneListRecordings,
  userplaneGetRecording,
  userplaneDeleteRecording,
  userplaneListLinks,
  userplaneCreateLink,
  userplaneGetLink,
  userplaneUpdateLink,
  userplaneDeleteLink,
  userplaneGetRecVideo,
  userplaneGetRecThumb,
  userplaneGetRecConsole,
  userplaneGetRecNetwork,
  userplaneGetRecActions,
  userplaneShowRecording,
] as const;
