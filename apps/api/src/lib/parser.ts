/**
 * Link reference parser - Parses link references to infer provider info
 * Detects provider type, extracts canonical IDs, and generates titles
 */

import { isValidUrl } from '@workspace/contract';

import type { LinkProviderType } from '@/api/types';

/**
 * Result of parsing a link reference
 */
export interface ParsedLinkReference {
  linkTitle: string | null;
  linkProviderType: LinkProviderType;
  linkProviderId: string | null;
  linkProviderRef: string | null;
}

/**
 * Provider URL patterns for detection
 * Each pattern includes regex to match URL and extract canonical ID
 */
interface ProviderPattern {
  type: NonNullable<LinkProviderType>;
  // Hostname patterns to match
  hostPatterns: RegExp[];
  // Path pattern to extract canonical ID (first capture group is the ID)
  pathPattern?: RegExp;
  // Function to generate title from canonical ID
  generateTitle: (id: string) => string;
}

const PROVIDER_PATTERNS: ProviderPattern[] = [
  // Support/Helpdesk Providers
  {
    type: 'intercom',
    hostPatterns: [/\.intercom\.(?:com|io)$/i, /^app\.intercom\./i],
    pathPattern: /\/(?:conversations?|inbox\/conversation)\/(\d+)/i,
    generateTitle: (id) => `Intercom #${id}`,
  },
  {
    type: 'zendesk',
    hostPatterns: [/\.zendesk\.com$/i],
    pathPattern: /\/(?:agent\/tickets|hc\/.*?\/requests)\/(\d+)/i,
    generateTitle: (id) => `Zendesk #${id}`,
  },
  {
    type: 'hubspot',
    hostPatterns: [/\.hubspot\.com$/i],
    pathPattern: /\/(?:contacts?|tickets?|deals?)\/(\d+)/i,
    generateTitle: (id) => `HubSpot #${id}`,
  },
  {
    type: 'freshdesk',
    hostPatterns: [/\.freshdesk\.com$/i],
    pathPattern: /\/(?:a\/tickets|helpdesk\/tickets)\/(\d+)/i,
    generateTitle: (id) => `Freshdesk #${id}`,
  },
  {
    type: 'freshchat',
    hostPatterns: [/\.freshchat\.com$/i, /\.freshworks\.com$/i],
    pathPattern: /\/(?:conversations?|messages?)\/([a-zA-Z0-9_-]+)/i,
    generateTitle: (id) => `Freshchat ${id}`,
  },
  {
    type: 'jira_service_management',
    hostPatterns: [/\.atlassian\.net$/i],
    pathPattern: /\/servicedesk\/.*?\/([A-Z][A-Z0-9]*-\d+)/i,
    generateTitle: (id) => `JSM ${id}`,
  },
  {
    type: 'helpscout',
    hostPatterns: [/\.helpscout\.(?:com|net)$/i, /^secure\.helpscout\./i],
    pathPattern: /\/conversation\/(\d+)/i,
    generateTitle: (id) => `Help Scout #${id}`,
  },
  {
    type: 'happyfox',
    hostPatterns: [/\.happyfox\.com$/i],
    pathPattern: /\/(?:staff\/)?ticket\/(\d+)/i,
    generateTitle: (id) => `HappyFox #${id}`,
  },
  {
    type: 'ada',
    hostPatterns: [/\.ada\.(?:cx|support)$/i],
    pathPattern: /\/(?:conversations?|chats?)\/([a-zA-Z0-9_-]+)/i,
    generateTitle: (id) => `Ada ${id}`,
  },
  {
    type: 'forethought',
    hostPatterns: [/\.forethought\.ai$/i],
    pathPattern: /\/(?:tickets?|conversations?)\/([a-zA-Z0-9_-]+)/i,
    generateTitle: (id) => `Forethought ${id}`,
  },
  {
    type: 'servicenow',
    hostPatterns: [/\.service-now\.com$/i, /\.servicenow\.com$/i],
    pathPattern: /\/(?:nav_to\.do\?uri=)?(?:incident|case)\.do\?.*?sys_id=([a-f0-9]{32})/i,
    generateTitle: (id) => `ServiceNow ${id.substring(0, 8)}`,
  },
  {
    type: 'front',
    hostPatterns: [/\.frontapp\.com$/i, /^app\.front\.com$/i],
    pathPattern: /\/(?:conversations?|inboxes?\/.*?\/conversations?)\/([a-zA-Z0-9_]+)/i,
    generateTitle: (id) => `Front ${id}`,
  },
  {
    type: 'zoho_desk',
    hostPatterns: [/\.zoho\.(?:com|eu|in)$/i, /desk\.zoho\./i],
    pathPattern: /\/(?:agent\/)?(?:tickets?|cases?)\/(\d+)/i,
    generateTitle: (id) => `Zoho Desk #${id}`,
  },
  {
    type: 'crisp',
    hostPatterns: [/\.crisp\.chat$/i, /^app\.crisp\./i],
    pathPattern: /\/(?:website\/.*?\/)?inbox\/([a-zA-Z0-9_-]+)/i,
    generateTitle: (id) => `Crisp ${id}`,
  },
  {
    type: 'pylon',
    hostPatterns: [/\.usepylon\.com$/i, /\.pylon\.com$/i],
    pathPattern: /\/(?:conversations?|issues?)\/([a-zA-Z0-9_-]+)/i,
    generateTitle: (id) => `Pylon ${id}`,
  },
  {
    type: 'plain',
    hostPatterns: [/\.plain\.com$/i],
    pathPattern: /\/(?:thread|customer)\/((?:thr|cus)_[a-zA-Z0-9]+)/i,
    generateTitle: (id) => `Plain ${id}`,
  },

  // Project Management / Dev Tools
  {
    type: 'asana',
    hostPatterns: [/\.asana\.com$/i],
    pathPattern: /\/(?:0\/)?(?:\d+\/)?(?:list|board|timeline|calendar|files)?\/?\d*\/?(\d{16,})/i,
    generateTitle: (id) => `Asana ${id.substring(0, 8)}`,
  },
  {
    type: 'azure_devops',
    hostPatterns: [/\.azure\.com$/i, /dev\.azure\.com$/i, /\.visualstudio\.com$/i],
    pathPattern: /\/(?:_workitems\/edit|_boards\/.*?)\/(\d+)/i,
    generateTitle: (id) => `Azure DevOps #${id}`,
  },
  {
    type: 'clickup',
    hostPatterns: [/\.clickup\.com$/i],
    pathPattern: /\/t\/([a-zA-Z0-9]+)/i,
    generateTitle: (id) => `ClickUp ${id}`,
  },
  {
    type: 'github',
    hostPatterns: [/^github\.com$/i, /\.github\.com$/i],
    pathPattern: /\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/i,
    generateTitle: (id) => {
      const parts = id.split('/');
      return parts.length > 1 ? `${parts[parts.length - 1]}` : `GitHub #${id}`;
    },
  },
  {
    type: 'gitlab',
    hostPatterns: [/^gitlab\.com$/i, /\.gitlab\.com$/i, /gitlab\./i],
    pathPattern: /\/([^/]+(?:\/[^/]+)?)\/(?:-\/)?(?:issues|merge_requests)\/(\d+)/i,
    generateTitle: (id) => {
      const parts = id.split('/');
      return parts.length > 1 ? `${parts[parts.length - 1]}` : `GitLab #${id}`;
    },
  },
  {
    type: 'jira',
    hostPatterns: [/\.atlassian\.net$/i, /^jira\./i],
    pathPattern: /\/(?:jira\/)?browse\/([A-Z][A-Z0-9]*-\d+)/i,
    generateTitle: (id) => id,
  },
  {
    type: 'linear',
    hostPatterns: [/^linear\.app$/i, /\.linear\.app$/i],
    pathPattern: /\/(?:issue|[^/]+)\/([A-Z]+-\d+)/i,
    generateTitle: (id) => id,
  },
  {
    type: 'notion',
    hostPatterns: [/\.notion\.so$/i, /^notion\.so$/i],
    pathPattern: /\/([a-zA-Z0-9-]+)-([a-f0-9]{32})/i,
    generateTitle: (id) => `Notion ${id.substring(0, 8)}`,
  },
  {
    type: 'sentry',
    hostPatterns: [/\.sentry\.io$/i, /^sentry\.io$/i],
    pathPattern: /\/(?:issues|organizations\/[^/]+\/issues)\/(\d+)/i,
    generateTitle: (id) => `Sentry #${id}`,
  },
  {
    type: 'slack',
    hostPatterns: [/\.slack\.com$/i],
    pathPattern: /\/archives\/([A-Z0-9]+)(?:\/p(\d+))?/i,
    generateTitle: (id) => `Slack ${id}`,
  },
];

// isValidUrl imported from @workspace/contract

/**
 * Try to match URL against known provider patterns
 */
function matchProvider(url: URL): { type: LinkProviderType; id: string; title: string } | null {
  for (const pattern of PROVIDER_PATTERNS) {
    // Check if hostname matches any of the patterns
    const hostMatches = pattern.hostPatterns.some((hp) => hp.test(url.hostname));
    if (!hostMatches) continue;

    // Try to extract canonical ID from path if pattern exists
    if (pattern.pathPattern) {
      const pathMatch = url.pathname.match(pattern.pathPattern);
      if (pathMatch) {
        // For GitHub/GitLab, combine repo and issue number
        if (
          (pattern.type === 'github' || pattern.type === 'gitlab') &&
          pathMatch[1] &&
          pathMatch[2]
        ) {
          const id = pathMatch[2];
          return {
            type: pattern.type,
            id,
            title: pattern.generateTitle(`${pathMatch[1]}/${id}`),
          };
        }

        if (pathMatch[1]) {
          const id = pathMatch[1];
          return {
            type: pattern.type,
            id,
            title: pattern.generateTitle(id),
          };
        }
      }
    }

    // Host matched but couldn't extract ID - still recognize as this provider
    const providerName = pattern.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      type: pattern.type,
      id: url.pathname,
      title: `${providerName} Link`,
    };
  }

  return null;
}

/**
 * Parse a link reference to extract provider information
 *
 * Logic:
 * 1. If input is a URL of a known provider:
 *    - Set linkProviderType to the detected provider
 *    - Extract canonical ID into linkProviderId
 *    - Store full URL in linkProviderRef
 *    - Generate title based on provider and ID
 *
 * 2. If input is a URL but NOT a known provider:
 *    - Set linkProviderType to 'web'
 *    - Store URL in linkProviderRef
 *    - linkTitle = null, linkProviderId = null
 *
 * 3. If input is NOT a URL (plain text):
 *    - Set linkProviderType to 'others'
 *    - Treat input as linkTitle
 *    - linkProviderId = null, linkProviderRef = null
 */
export function parseLinkReference(reference: string): ParsedLinkReference {
  const trimmed = reference.trim();

  // Check if it's a valid URL
  if (!isValidUrl(trimmed)) {
    // Not a URL - treat as plain text title with 'others' provider type
    return {
      linkTitle: trimmed || null,
      linkProviderType: 'others',
      linkProviderId: null,
      linkProviderRef: null,
    };
  }

  const url = new URL(trimmed);

  // Try to match against known providers
  const providerMatch = matchProvider(url);

  if (providerMatch) {
    // Known provider - extract all info
    return {
      linkTitle: providerMatch.title,
      linkProviderType: providerMatch.type,
      linkProviderId: providerMatch.id,
      linkProviderRef: trimmed,
    };
  }

  // Unknown provider URL - mark as 'web'
  return {
    linkTitle: null,
    linkProviderType: 'web',
    linkProviderId: null,
    linkProviderRef: trimmed,
  };
}
