/**
 * Subject for Project - Deletion Requested Email
 */

export const subject = (params: { requesterName: string; projectName: string }) =>
  `${params.requesterName} requested to delete ${params.projectName}`;
