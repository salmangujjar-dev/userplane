/**
 * Subject for Workspace - Access Requested Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested access to ${params.workspaceName}`;
