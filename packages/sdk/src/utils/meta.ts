/**
 * Meta tag utilities
 * Handles extraction of workspace IDs from HTML meta tags.
 */

import { META_SELECTORS } from '../constants';

/**
 * Read workspace IDs from meta tags in the document.
 * Supports multiple meta tags for multi-workspace scenarios.
 *
 * @returns Array of workspace IDs found in meta tags
 */
export function readWorkspaceIds(): string[] {
  const metaTags = document.querySelectorAll(META_SELECTORS.WORKSPACE);

  if (metaTags.length === 0) {
    console.warn(
      '[Userplane] No workspace meta tag found. Add: <meta name="userplane:workspace" content="ws_xxx" />'
    );
    return [];
  }

  const workspaceIds: string[] = [];
  metaTags.forEach((metaTag) => {
    const workspaceId = metaTag.getAttribute('content');
    if (workspaceId) {
      workspaceIds.push(workspaceId);
    }
  });

  console.log('[Userplane] Workspace IDs found:', workspaceIds);
  return workspaceIds;
}
