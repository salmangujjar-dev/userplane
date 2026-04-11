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
  userplaneGetRecInfo,
  userplaneGetRecNetwork,
  userplaneGetRecThumb,
  userplaneGetRecVideo,
} from './tools/recording-resources';
import { userplaneDeleteRecording, userplaneListRecordings } from './tools/recordings';
import { userplaneShowRecActions } from './tools/show-rec-actions';
import { userplaneShowRecConsole } from './tools/show-rec-console';
import { userplaneShowRecNetwork } from './tools/show-rec-network';
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
  userplaneDeleteRecording,
  userplaneListLinks,
  userplaneCreateLink,
  userplaneGetLink,
  userplaneUpdateLink,
  userplaneDeleteLink,
  userplaneGetRecInfo,
  userplaneGetRecVideo,
  userplaneGetRecThumb,
  userplaneGetRecConsole,
  userplaneGetRecNetwork,
  userplaneGetRecActions,
  userplaneShowRecording,
  userplaneShowRecConsole,
  userplaneShowRecNetwork,
  userplaneShowRecActions,
] as const;
