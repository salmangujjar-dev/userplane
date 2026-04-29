export * from './tools';
export * from './types';

import { userplaneAppFetchResource } from './tools/app-fetch-resource';
import { userplaneGetDomain, userplaneListDomains } from './tools/domains';
import {
  userplaneCreateLink,
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
import { userplaneListRecordings } from './tools/recordings';
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
  userplaneListDomains,
  userplaneGetDomain,
  userplaneListRecordings,
  userplaneGetRecInfo,
  userplaneGetRecVideo,
  userplaneGetRecThumb,
  userplaneGetRecConsole,
  userplaneGetRecNetwork,
  userplaneGetRecActions,
  userplaneListLinks,
  userplaneCreateLink,
  userplaneGetLink,
  userplaneUpdateLink,
  userplaneShowRecording,
  userplaneAppFetchResource,
  userplaneShowRecConsole,
  userplaneShowRecNetwork,
  userplaneShowRecActions,
] as const;
