/**
 * Shared fallback utilities for email templates
 * Provides consistent default values and formatting across all email templates
 */

/**
 * Formats workspace name by trimming and applying defaults
 * Returns 'Your workspace' if the workspace name is empty or undefined
 */
export const getWorkspaceName = (workspaceName?: string): string => {
  const trimmed = workspaceName?.trim();
  return trimmed || 'Your workspace';
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
 * Formats appeal URL by trimming and applying defaults
 * Returns support email with account appeal subject if not provided
 */
export const getAppealUrl = (appealUrl?: string): string => {
  const trimmed = appealUrl?.trim();
  return trimmed || 'mailto:support@userplane.io?subject=Account%20Appeal';
};

/**
 * Formats terms of service URL by trimming and applying defaults
 * Returns userplane.io terms page if not provided
 */
export const getTosUrl = (tosUrl?: string): string => {
  const trimmed = tosUrl?.trim();
  return trimmed || 'https://userplane.io/terms';
};

/**
 * Formats login URL by trimming and applying defaults
 * Returns userplane.io login page if not provided
 */
export const getLoginUrl = (loginUrl?: string): string => {
  const trimmed = loginUrl?.trim();
  return trimmed || 'https://app.userplane.io/auth';
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
