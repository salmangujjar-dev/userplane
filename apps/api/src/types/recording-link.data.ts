/**
 * Recording link API response data types
 * Types for recording link endpoint responses
 */

import type { PaginationMeta } from './common';
import type { LinkProviderType } from './recording-link.service';

/**
 * Provider information for recording link
 */
export interface RecordingLinkProvider {
  type: LinkProviderType | null;
  id: string | null;
  reference: string | null;
}

/**
 * Recording link item in list response
 */
export interface RecordingLinkItem {
  id: string;
  linkGUID: string;
  linkTitle: string | null;
  linkReusable: boolean;
  linkProvider: RecordingLinkProvider;
  createdAt: Date;
  project: {
    id: string;
    title: string | null;
  };
  creator: {
    id: string;
    name: string;
  };
}

/**
 * Response data for listing recording links
 */
export interface RecordingLinksListData {
  workspaceId: string;
  recordingLinks: RecordingLinkItem[];
  pagination: PaginationMeta;
}

/**
 * Response data for updating a recording link
 */
export interface RecordingLinkUpdateData {
  workspaceId: string;
  recordingLink: {
    id: string;
    linkTitle: string | null;
    linkReusable: boolean;
    linkProvider: RecordingLinkProvider;
  };
}

/**
 * Response data for creating a recording link
 */
export interface RecordingLinkCreateData {
  workspaceId: string;
  recordingLink: {
    id: string;
    linkGUID: string;
    linkTitle: string | null;
    linkReusable: boolean;
    linkProvider: RecordingLinkProvider;
    createdAt: Date;
  };
}
