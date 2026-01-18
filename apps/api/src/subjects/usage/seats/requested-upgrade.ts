/**
 * Subject for Usage - Seats Requested Upgrade Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested more seats for ${params.workspaceName}`;
