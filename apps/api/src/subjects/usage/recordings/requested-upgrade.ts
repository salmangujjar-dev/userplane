/**
 * Subject for Usage - Recordings Requested Upgrade Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested more recordings for ${params.workspaceName}`;
