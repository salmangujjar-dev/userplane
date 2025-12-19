/**
 * Workspace utility functions
 * Helper functions for workspace name derivation and formatting
 */

/**
 * Derive workspace name from domain
 *
 * @example
 * deriveWorkspaceName("example.com") → "Example"
 * deriveWorkspaceName("my-startup.io") → "My Startup"
 */
export function deriveWorkspaceName(domain: string): string {
  const baseName = domain.split('.')[0];
  if (!baseName) {
    return 'Workspace';
  }
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Derive workspace name from user's name
 * Uses first name if available, otherwise falls back to "Workspace"
 *
 * @example
 * deriveWorkspaceNameFromUser("John Doe") → "John's workspace"
 * deriveWorkspaceNameFromUser("Jane") → "Jane's workspace"
 * deriveWorkspaceNameFromUser("") → "workspace"
 * deriveWorkspaceNameFromUser(null) → "workspace"
 */
export function deriveWorkspaceNameFromUser(userName: string | null | undefined): string {
  if (!userName || userName.trim() === '') {
    return 'workspace';
  }

  const firstName = userName.trim().split(/\s+/)[0];
  if (!firstName) {
    return 'workspace';
  }

  return `${firstName}'s workspace`;
}
