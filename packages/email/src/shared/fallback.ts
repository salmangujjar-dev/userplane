/**
 * Shared fallback utilities for email templates
 * Provides consistent default values and formatting across all email templates
 *
 * NOTE: URL building is handled by the email service layer, not by templates.
 * Templates should receive pre-built URLs as props.
 */

/**
 * Formats workspace name by trimming and applying defaults
 * Returns 'Your workspace' if the workspace name is empty or undefined
 */
export const getWorkspaceName = (workspaceName?: string): string => {
  const trimmed = workspaceName?.trim();
  return trimmed || 'Userplane';
};

/**
 * Formats deletion date by trimming and applying defaults
 * If no date provided, sets it to 30 days from today
 * Returns date in locale date string format
 */
export const getDeletionDate = (deletionDate?: string): string => {
  const trimmed = deletionDate?.trim();
  if (trimmed) {
    return trimmed;
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  return futureDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats user name by trimming and applying defaults
 * Returns 'there' if the user name is empty or undefined
 */
export const getUserName = (userName?: string): string => {
  const trimmed = userName?.trim();
  return trimmed || 'there';
};

/**
 * Formats project name by trimming and applying defaults
 * Returns 'Your project' if the project name is empty or undefined
 */
export const getProjectName = (projectName?: string): string => {
  const trimmed = projectName?.trim();
  return trimmed || 'Your project';
};

/**
 * Formats teammate name by trimming and applying defaults
 * Returns 'Your teammate' if the teammate name is empty or undefined
 */
export const getTeammateName = (memberName?: string): string => {
  const trimmed = memberName?.trim();
  return trimmed || 'Your teammate';
};

/**
 * Formats member name by trimming and applying defaults
 * Returns 'A member' if the member name is empty or undefined
 */
export const getMemberName = (memberName?: string): string => {
  const trimmed = memberName?.trim();
  return trimmed || 'A member';
};

/**
 * Formats domain name by trimming and applying defaults
 * Returns 'your domain' if the domain name is empty or undefined
 */
export const getDomainName = (domainName?: string): string => {
  const trimmed = domainName?.trim();
  return trimmed || 'your domain';
};

/**
 * Formats requester name by trimming and applying defaults
 * If both name and email are present, returns 'Name (email)'
 * Falls back to email if name is empty, and to 'Someone' if both are empty
 */
export const getRequesterName = (requesterName?: string, requesterEmail?: string): string => {
  const trimmedName = requesterName?.trim();
  const trimmedEmail = requesterEmail?.trim();

  if (trimmedName && trimmedEmail) {
    return `${trimmedName} (${trimmedEmail})`;
  }

  if (trimmedName) {
    return trimmedName;
  }

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return 'Someone';
};
