/**
 * Centralized support and help article links
 * All dashboard references to docs articles should use these constants
 * so URLs stay consistent and easy to update
 */

import { DOCS_URL } from '@userplane/contract';

/**
 * Build a full docs article URL from a relative path
 */
const docsUrl = (path: string) => `${DOCS_URL}${path}`;

/**
 * Docs article links used across the dashboard
 */
export const SUPPORT_LINKS = {
  helpCenter: DOCS_URL,
  recordingLinks: docsUrl('/recording-links/managing'),
  sharingLinks: docsUrl('/recording/requesting'),
  linkCreationErrors: docsUrl('/recording-links/limits'),
  teamInvites: docsUrl('/workspace/team-management'),
  projects: docsUrl('/workspace/projects'),
  domains: docsUrl('/workspace/domains'),
  domainVerification: docsUrl('/workspace/domain-verification'),
  domainPreferences: docsUrl('/recording-links/domain-preferences'),
  integrations: docsUrl('/integrations/intercom'),
  apiKeys: docsUrl('/api/authentication'),
} as const;
