/**
 * Subject for Workspace - Deletion Scheduled Email
 */

export const subject = (params: { workspaceName: string; deletionDate: string }) =>
  `${params.workspaceName} scheduled for deletion on ${params.deletionDate}`;
