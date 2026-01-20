/**
 * Subject for Workspace - Access Request Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested to join ${params.workspaceName}`;
