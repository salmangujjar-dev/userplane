/**
 * Link API response data types
 * Types for link endpoint responses
 */

import type { Domain } from '@workspace/db';
import type { PaginationMeta } from './common';
import type { LinkProviderType, LinkType } from './link.service';

/**
 * Link item in list response
 */
export interface LinkItem {
  id: string;
  linkTitle: string | null;
  linkType: LinkType;
  linkReusable: boolean;
  linkProviderType: LinkProviderType | null;
  linkProviderId: string | null;
  linkProviderReference: string | null;
  linkURL: string;
  createdAt: Date;
  project: {
    id: string;
    title: string | null;
  };
  creator: {
    id: string;
    name: string;
  };
  domain: {
    id: string;
    url: string;
    status: Domain['domainStatus'];
  };
}

/**
 * Response data for listing links
 */
export interface LinksListData {
  workspaceId: string;
  links: LinkItem[];
  pagination: PaginationMeta;
}

/**
 * Response data for updating a link
 */
export interface LinkUpdateData {
  workspaceId: string;
  link: {
    id: string;
    linkTitle: string | null;
    linkReusable: boolean;
    linkProviderType: LinkProviderType | null;
    linkProviderId: string | null;
    linkProviderReference: string | null;
    linkURL: string;
    domain: {
      id: string;
      url: string;
      status: Domain['domainStatus'];
    };
  };
}

/**
 * Response data for creating a link
 */
export interface LinkCreateData {
  workspaceId: string;
  link: {
    id: string;
    linkTitle: string | null;
    linkType: LinkType;
    linkReusable: boolean;
    linkProviderType: LinkProviderType | null;
    linkProviderId: string | null;
    linkProviderReference: string | null;
    linkURL: string;
    createdAt: Date;
    domain: {
      id: string;
      url: string;
      status: Domain['domainStatus'];
    };
  };
}

/**
 * Response data for getting a link by ID
 */
export interface LinkGetData {
  workspaceId: string;
  link: {
    id: string;
    linkTitle: string | null;
    linkType: LinkType;
    linkReusable: boolean;
    linkProviderType: LinkProviderType | null;
    linkProviderId: string | null;
    linkProviderReference: string | null;
    linkURL: string;
    createdAt: Date;
    project: {
      id: string;
      title: string | null;
    };
    creator: {
      id: string;
      name: string;
    };
    domain: {
      id: string;
      url: string;
      status: Domain['domainStatus'];
    };
  };
}
