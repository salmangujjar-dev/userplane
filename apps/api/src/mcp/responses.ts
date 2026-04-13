import type {
  McpDomainItem,
  McpDomainResponse,
  McpLinkItem,
  McpLinkResponse,
  McpListDomains,
  McpListLinks,
  McpListProjects,
  McpListRecordings,
  McpListWorkspaces,
  McpProfile,
  McpProjectDetail,
  McpProjectItem,
  McpRecordingDetail,
  McpRecordingItem,
  McpRecThumb,
  McpRecVideo,
  McpWorkspaceDetail,
  McpWorkspaceItem,
} from '@userplane/contract';

import type { McpDomainRow } from '@/api/repositories/domains.repository';
import type { McpLinkRow } from '@/api/repositories/links.repository';
import type { McpProjectRow } from '@/api/repositories/projects.repository';
import type {
  McpRecordingDetailRow,
  McpRecordingRow,
} from '@/api/repositories/recordings.repository';
import type {
  McpWorkspaceDetailRow,
  McpWorkspaceRow,
} from '@/api/repositories/workspaces.repository';
import type { ResourceResponse } from '@/api/types/internal';
import { recordingUrls, workspaceUrls } from '@/api/utils/email-urls';

/**
 * Transformers from lean repo rows to MCP response shapes.
 *
 * Every function is a pure mapping. The repo layer already trims the DB
 * query to the exact column set the response needs, so transformers don't
 * field-strip — they only attach computed URL fields (`playerUrl`,
 * `dashboardUrl`) that aren't stored in the database.
 *
 * Return types are declared via the `Mcp*` types from `@userplane/contract`,
 * so TS catches any drift between transformer output and the schemas that
 * docs/clients ground themselves in. No runtime validation in the hot path
 * — the schemas are a static contract.
 *
 * URL builders (`recordingUrls.view`, `workspaceUrls.dashboard`) are reused
 * from the email utils — same `env.dashboard.baseUrl`, no duplication.
 */

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export function toMcpWorkspaceItem(row: McpWorkspaceRow): McpWorkspaceItem {
  return {
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
  };
}

export function toMcpWorkspaceDetail(row: McpWorkspaceDetailRow): McpWorkspaceDetail {
  return {
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    createdAt: row.createdAt,
    dashboardUrl: workspaceUrls.dashboard(row.workspaceId),
  };
}

export function toMcpListWorkspaces(
  workspaces: McpWorkspaceRow[],
  total: number
): McpListWorkspaces {
  return {
    workspaces: workspaces.map(toMcpWorkspaceItem),
    total,
  };
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export function toMcpProjectItem(row: McpProjectRow): McpProjectItem {
  return {
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    isDefault: row.isDefault,
    recordingRetentionDays: row.recordingRetentionDays,
  };
}

export function toMcpProjectDetail(workspaceId: string, row: McpProjectRow): McpProjectDetail {
  return {
    workspaceId,
    ...toMcpProjectItem(row),
  };
}

export function toMcpListProjects(
  workspaceId: string,
  projects: McpProjectRow[],
  total: number
): McpListProjects {
  return {
    workspaceId,
    projects: projects.map(toMcpProjectItem),
    total,
  };
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export function toMcpRecordingItem(workspaceId: string, row: McpRecordingRow): McpRecordingItem {
  return {
    recordingId: row.recordingId,
    durationMs: row.recordingDurationMs,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    creatorName: row.creatorName,
    linkTitle: row.linkTitle,
    playerUrl: recordingUrls.view(workspaceId, row.recordingId),
  };
}

export function toMcpListRecordings(
  workspaceId: string,
  recordings: McpRecordingRow[],
  total: number
): McpListRecordings {
  return {
    workspaceId,
    recordings: recordings.map((r) => toMcpRecordingItem(workspaceId, r)),
    total,
  };
}

export function toMcpRecordingDetail(
  workspaceId: string,
  row: McpRecordingDetailRow
): McpRecordingDetail {
  return {
    workspaceId,
    recordingId: row.recordingId,
    durationMs: row.recordingDurationMs,
    startedAt: row.recordingStartedAt,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    status: row.uploadStatus,
    linkId: row.recordingLinkId,
    linkTitle: row.linkTitle,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    domainUrl: row.domainUrl,
    creatorName: row.creatorName,
    playerUrl: recordingUrls.view(workspaceId, row.recordingId),
  };
}

// ---------------------------------------------------------------------------
// Recording resources
// ---------------------------------------------------------------------------

export function toMcpRecVideo(recordingId: string, resource: ResourceResponse): McpRecVideo {
  return {
    recordingId,
    url: resource.url,
    durationMs: resource.durationMs ?? null,
  };
}

export function toMcpRecThumb(recordingId: string, resource: ResourceResponse): McpRecThumb {
  return {
    recordingId,
    url: resource.url,
  };
}

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

export function toMcpDomainItem(row: McpDomainRow): McpDomainItem {
  return {
    domainId: row.domainId,
    domainUrl: row.domainUrl,
    domainStatus: row.domainStatus,
    createdAt: row.createdAt,
  };
}

export function toMcpDomainDetail(workspaceId: string, row: McpDomainRow): McpDomainResponse {
  return { workspaceId, domain: toMcpDomainItem(row) };
}

export function toMcpListDomains(
  workspaceId: string,
  domains: McpDomainRow[],
  total: number
): McpListDomains {
  return {
    workspaceId,
    domains: domains.map(toMcpDomainItem),
    total,
  };
}

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

/**
 * Link row augmented with the composed `linkURL` field. The service's
 * `*ForMcp` methods run rows through `generateLinkURL` before handing them
 * off so this transformer stays a pure field rename.
 */
type McpLinkRowWithUrl = McpLinkRow & { linkURL: string };

export function toMcpLinkItem(row: McpLinkRowWithUrl): McpLinkItem {
  return {
    linkId: row.linkId,
    linkTitle: row.linkTitle,
    linkURL: row.linkURL,
    linkReusable: row.linkReusable,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    domainId: row.domainId,
    domainUrl: row.domainUrl,
    creatorName: row.creatorName,
    createdAt: row.createdAt,
  };
}

export function toMcpLinkResponse(workspaceId: string, row: McpLinkRowWithUrl): McpLinkResponse {
  return { workspaceId, link: toMcpLinkItem(row) };
}

export function toMcpListLinks(
  workspaceId: string,
  links: McpLinkRowWithUrl[],
  total: number
): McpListLinks {
  return {
    workspaceId,
    links: links.map(toMcpLinkItem),
    total,
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function toMcpProfile(
  user: { id: string; name: string; email: string },
  stats: { workspaces: number; recordings: number; links: number }
): McpProfile {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    stats,
  };
}
