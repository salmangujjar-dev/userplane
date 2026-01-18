/**
 * Subject for Usage - Links Requested Upgrade Email
 */

export const subject = (params: { requesterName: string; workspaceName: string }) =>
  `${params.requesterName} requested more links for ${params.workspaceName}`;
