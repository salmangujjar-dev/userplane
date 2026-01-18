/**
 * Subject for Workspace - Deletion Requested Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested to delete ${params.workspaceName}`;
