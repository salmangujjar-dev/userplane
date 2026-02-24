/**
 * Centralized support and help article links
 * All dashboard references to help center articles should use these constants
 * so URLs stay consistent and environment-aware (dev vs prod home site)
 */

import { env } from '@/env';

/**
 * Build a full help article URL from a relative path
 */
const helpUrl = (path: string) => `${env.home.url}/help/${path}`;

/**
 * Help article links used across the dashboard
 */
export const SUPPORT_LINKS = {
  // Help center root
  helpCenter: helpUrl(''),
  // Article-specific links
  recordingLinks: helpUrl('recording-links/managing-recording-links'),
  sharingLinks: helpUrl('recording/requesting-a-recording'),
  linkCreationErrors: helpUrl('recording-links/recording-limits-and-duration'),
  teamInvites: helpUrl('workspace/team-management'),
  projects: helpUrl('workspace/projects-overview'),
  domains: helpUrl('workspace/domains-overview'),
  domainVerification: helpUrl('workspace/domain-verification'),
  integrations: helpUrl('integrations/intercom-integration'),
} as const;
